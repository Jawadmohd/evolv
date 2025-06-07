package com.evolv.backend.learning;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Service
class VideoService {
    private static final Pattern VIDEO_ID = Pattern.compile("[a-zA-Z0-9_-]{11}");
    private final Map<String, CachedVideos> cache = new LinkedHashMap<>(64, 0.75f, true);
    private final RestClient youtube;
    private final String key;

    VideoService(@Value("${evolv.youtube.api-key:}") String key) {
        this.key = key;
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(3));
        factory.setReadTimeout(Duration.ofSeconds(5));
        this.youtube = RestClient.builder().requestFactory(factory).baseUrl("https://www.googleapis.com").build();
    }

    List<Video> recommendations(List<String> topics) {
        if (!topics.isEmpty() && key.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "YouTube recommendations are not configured");
        }
        Map<String, Video> results = new LinkedHashMap<>();
        for (String topic : topics) {
            for (Video video : search(topic)) {
                results.putIfAbsent(video.id(), video);
                if (results.size() == 10) {
                    return List.copyOf(results.values());
                }
            }
        }
        return List.copyOf(results.values());
    }

    private List<Video> search(String topic) {
        synchronized (cache) {
            CachedVideos entry = cache.get(topic);
            if (entry != null && entry.expires().isAfter(Instant.now())) {
                return entry.videos();
            }
        }
        try {
            SearchResult result = youtube.get().uri("/youtube/v3/search?part=snippet&type=video&maxResults=3"
                    + "&relevanceLanguage=en&q={topic}&key={key}", topic, key)
                .retrieve().body(SearchResult.class);
            List<Video> videos = result == null || result.items() == null ? List.of() : result.items().stream()
                .filter(item -> item.id() != null && item.snippet() != null)
                .filter(item -> item.id().videoId() != null && VIDEO_ID.matcher(item.id().videoId()).matches())
                .filter(item -> Objects.nonNull(item.snippet().title()))
                .map(item -> new Video(item.id().videoId(), item.snippet().title(), item.snippet().channelTitle(), topic))
                .toList();
            synchronized (cache) {
                cache.put(topic, new CachedVideos(Instant.now().plus(Duration.ofHours(2)), videos));
                if (cache.size() > 128) {
                    cache.remove(cache.keySet().iterator().next());
                }
            }
            return videos;
        } catch (RestClientException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "YouTube recommendations are temporarily unavailable");
        }
    }

    record Video(String id, String title, String channel, String topic) {}
    private record SearchResult(List<Item> items) {}
    private record Item(VideoId id, Snippet snippet) {}
    private record VideoId(String videoId) {}
    private record Snippet(String title, String channelTitle) {}
    private record CachedVideos(Instant expires, List<Video> videos) {}
}
