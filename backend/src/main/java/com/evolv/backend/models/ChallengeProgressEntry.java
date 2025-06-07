package com.evolv.backend.models;

import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ChallengeProgressEntry {

    private LocalDate date;
    private String report;

    public ChallengeProgressEntry(LocalDate date, String report) {
        this.date = date;
        this.report = report;
    }
}
