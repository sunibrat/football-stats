#!/usr/bin/env Rscript

options(repos = c(CRAN = "https://cloud.r-project.org"))

# Инсталирай пакети ако трябва
if (!require("worldfootballR")) install.packages("worldfootballR")
if (!require("jsonlite")) install.packages("jsonlite")
if (!require("dplyr")) install.packages("dplyr")

library(worldfootballR)
library(jsonlite)
library(dplyr)

cat("========================================\n")
cat("🚀 FETCH ALL LEAGUES - START\n")
cat("========================================\n")

# Проверка на версиите (поправено)
cat("\n📦 Package versions:\n")
cat("  worldfootballR:", as.character(packageVersion("worldfootballR")), "\n")
cat("  jsonlite:", as.character(packageVersion("jsonlite")), "\n")
cat("  dplyr:", as.character(packageVersion("dplyr")), "\n")

# Създаване на папка data
if (!dir.exists("data")) dir.create("data")
cat("\n📁 Data folder:", getwd(), "/data\n")

# Само няколко държави за тест
countries <- c("ENG", "ESP", "ITA", "GER", "FRA")
season <- 2026

all_matches <- list()
leagues_index <- list()

for (i in seq_along(countries)) {
  country <- countries[i]
  cat(sprintf("\n[%d/%d] 📊 Processing %s...\n", i, length(countries), country))
  
  tryCatch({
    # Вземи URL за лигата
    league_urls <- fb_league_urls(
      country = country,
      gender = "M",
      season_end_year = season,
      tier = "1st"
    )
    
    if (length(league_urls) > 0) {
      cat("  ✅ Found league URL\n")
      
      # Вземи мачовете
      matches <- fb_match_results(league_urls[1])
      
      cat(sprintf("  ✅ Found %d matches\n", nrow(matches)))
      
      if (nrow(matches) > 0) {
        # Добави в индекса
        leagues_index[[country]] <- list(
          name = as.character(unique(matches$Comp)[1]),
          country = country,
          matches_count = nrow(matches)
        )
        
        # Добави първите 5 мача
        for (j in 1:min(5, nrow(matches))) {
          all_matches[[length(all_matches) + 1]] <- list(
            date = as.character(matches$Date[j]),
            home_team = as.character(matches$Home[j]),
            away_team = as.character(matches$Away[j]),
            home_score = as.numeric(matches$HomeGoals[j]),
            away_score = as.numeric(matches$AwayGoals[j]),
            competition = as.character(matches$Comp[j]),
            country = country
          )
        }
        cat(sprintf("  ✅ Added %d matches so far\n", length(all_matches)))
      }
      
      # Изчакване
      Sys.sleep(2)
    } else {
      cat("  ⚠️ No league URL found\n")
    }
  }, error = function(e) {
    cat("  ❌ ERROR:", e$message, "\n")
  })
}

# Записване на JSON файлове
cat("\n💾 Saving JSON files...\n")

if (length(leagues_index) > 0) {
  write_json(leagues_index, "data/leagues_index.json", pretty = TRUE, auto_unbox = TRUE)
  cat("  ✅ leagues_index.json -", length(leagues_index), "leagues\n")
} else {
  cat("  ⚠️ No leagues data\n")
  write_json(list(), "data/leagues_index.json", pretty = TRUE)
}

if (length(all_matches) > 0) {
  write_json(all_matches, "data/all_matches.json", pretty = TRUE, auto_unbox = TRUE)
  cat("  ✅ all_matches.json -", length(all_matches), "matches\n")
} else {
  cat("  ⚠️ No matches data\n")
  write_json(list(), "data/all_matches.json", pretty = TRUE)
}

cat("\n✅ FETCH ALL LEAGUES - COMPLETED\n")
cat("========================================\n")