package com.evolv.backend.todo.controllers;

import java.time.LocalDate;
import java.util.List;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.evolv.backend.config.security.AuthenticatedUser;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/todos")
@RequiredArgsConstructor
class TodoStatsController {
    private final JdbcClient jdbc;

    @GetMapping("/stats")
    Stats stats(@AuthenticationPrincipal AuthenticatedUser user) {
        String owner = user.username();
        var completions = jdbc.sql("""
            select cast(completed_at at time zone 'UTC' as date) as day, count(*) as total
            from todos
            where upper(username) = upper(:owner) and completed and completed_at is not null
            group by day order by day desc limit 90
            """).param("owner", owner)
            .query((rs, row) -> new Day(rs.getObject("day", LocalDate.class), rs.getLong("total"))).list();
        var deadlines = jdbc.sql("""
            select distinct cast(deadline at time zone 'UTC' as date) as day
            from todos where upper(username) = upper(:owner) and deadline is not null
            order by day desc limit 90
            """).param("owner", owner).query(LocalDate.class).list();
        long total = jdbc.sql("select count(*) from todos where upper(username) = upper(:owner) and completed")
            .param("owner", owner).query(Long.class).single();
        return new Stats(total, completions, deadlines);
    }

    record Stats(long totalCompleted, List<Day> completions, List<LocalDate> deadlines) {}
    record Day(LocalDate date, long count) {}
}
