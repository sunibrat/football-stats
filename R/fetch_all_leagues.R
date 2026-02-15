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

# Проверка на версиите
cat("\n📦 Package versions:\n")
cat("  worldfootballR:", as.character(packageVersion("worldfootballR")), "\n")
cat("  jsonlite:", as.character(packageVersion("jsonlite")), "\n")
cat("  dplyr:", as.character(packageVersion("dplyr")), "\n")

# Създаване на папка data
if (!dir.exists("data")) dir.create("data")
cat("\n📁 Data folder:", getwd(), "/data\n")

# Вземи всички налични лиги от FBref
cat("\n🌍 Fetching all available leagues...\n")

all_leagues <- fb_league_urls(
  country = c("ENG", "ESP", "ITA", "GER", "FRA", "NED", "POR", "BEL", "TUR", "BRA", "ARG", "USA"),
  gender = "M",
  season_end_year = 2024,  # Последният завършен сезон
  tier = "1st"
)

cat("  ✅ Found", length(all_leagues), "league URLs\n")

all_matches <- list()
leagues_index <- list()

for (i in seq_along(all_leagues)) {
  league_url <- all_leagues[i]
  cat(sprintf("\n[%d/%d] 📊 Processing league...\n", i, length(all_leagues)))
  
  tryCatch({
    # Вземи мачовете за лигата
    matches <- fb_match_results(league_url)
    
    cat(sprintf("  ✅ Found %d matches\n", nrow(matches)))
    
    if (nrow(matches) > 0) {
      # Вземи името на лигата
      league_name <- unique(matches$Comp)[1]
      
      # Добави в индекса
      leagues_index[[league_url]] <- list(
        name = as.character(league_name),
        url = league_url,
        matches_count = nrow(matches)
      )
      
      # Добави последните 10 мача
      for (j in 1:min(10, nrow(matches))) {
        all_matches[[length(all_matches) + 1]] <- list(
          date = as.character(matches$Date[j]),
          home_team = as.character(matches$Home[j]),
          away_team = as.character(matches$Away[j]),
          home_score = as.numeric(matches$HomeGoals[j]),
          away_score = as.numeric(matches$AwayGoals[j]),
          competition = as.character(league_name),
          league_url = league_url
        )
      }
      cat(sprintf("  ✅ Added %d matches total\n", length(all_matches)))
    }
    
    # Изчакване между заявките
    Sys.sleep(3)
    
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