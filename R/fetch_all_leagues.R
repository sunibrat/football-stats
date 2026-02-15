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
cat("🚀 FETCH ALL LEAGUES - DEBUG MODE\n")
cat("========================================\n")

# Проверка на версиите
cat("\n📦 Package versions:\n")
cat("  worldfootballR:", packageVersion("worldfootballR"), "\n")
cat("  jsonlite:", packageVersion("jsonlite"), "\n")
cat("  dplyr:", packageVersion("dplyr"), "\n")

# Създаване на папка data
if (!dir.exists("data")) dir.create("data")
cat("\n📁 Data folder:", normalizePath("data"), "\n")

# Само няколко държави за тест (за да работи по-бързо)
countries <- c("ENG", "ESP", "ITA", "GER", "FRA")

season <- 2026
all_matches <- list()
leagues_index <- list()

for (i in seq_along(countries)) {
  country <- countries[i]
  cat(sprintf("\n[%d/%d] 📊 Testing %s...\n", i, length(countries), country))
  
  tryCatch({
    # Опитай да вземеш URL за лигата
    cat("  🔍 Getting league URL...\n")
    league_urls <- fb_league_urls(
      country = country,
      gender = "M",
      season_end_year = season,
      tier = "1st"
    )
    
    cat("  📌 Found", length(league_urls), "URLs\n")
    
    if (length(league_urls) > 0) {
      cat("  📥 Fetching matches from:", league_urls[1], "\n")
      
      # Опитай да вземеш мачове
      matches <- fb_match_results(league_urls[1])
      
      cat("  ✅ Found", nrow(matches), "matches\n")
      
      if (nrow(matches) > 0) {
        # Добави в индекса
        leagues_index[[country]] <- list(
          name = unique(matches$Comp)[1],
          country = country,
          matches_count = nrow(matches)
        )
        
        # Добави първите 5 мача
        for (j in 1:min(5, nrow(matches))) {
          all_matches <- append(all_matches, list(list(
            date = as.character(matches$Date[j]),
            home_team = matches$Home[j],
            away_team = matches$Away[j],
            home_score = matches$HomeGoals[j],
            away_score = matches$AwayGoals[j],
            competition = matches$Comp[j],
            country = country
          )))
        }
        cat("  ✅ Added", length(all_matches), "total matches so far\n")
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
  cat("  ⚠️ No leagues data to save\n")
  write_json(list(), "data/leagues_index.json", pretty = TRUE)
}

if (length(all_matches) > 0) {
  write_json(all_matches, "data/all_matches.json", pretty = TRUE, auto_unbox = TRUE)
  cat("  ✅ all_matches.json -", length(all_matches), "matches\n")
} else {
  cat("  ⚠️ No matches data to save\n")
  write_json(list(), "data/all_matches.json", pretty = TRUE)
}

cat("\n✅ TEST COMPLETE\n")
cat("========================================\n")