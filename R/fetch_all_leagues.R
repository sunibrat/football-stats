#!/usr/bin/env Rscript

options(repos = c(CRAN = "https://cloud.r-project.org"))

if (!require("worldfootballR")) install.packages("worldfootballR")
if (!require("jsonlite")) install.packages("jsonlite")
if (!require("dplyr")) install.packages("dplyr")

library(worldfootballR)
library(jsonlite)
library(dplyr)

cat("========================================\n")
cat("🚀 FETCH ALL LEAGUES - START\n")
cat("========================================\n")

# Създаване на папка data
if (!dir.exists("data")) dir.create("data")

# Списък с държави
countries <- c("ENG", "ESP", "ITA", "GER", "FRA", "NED", "POR", "BRA", "ARG")

all_matches <- list()
leagues_index <- list()

for (country in countries) {
  cat(sprintf("\n📊 Processing %s...\n", country))
  
  tryCatch({
    # Вземи URL за лигата със задължителния gender параметър
    league_urls <- fb_league_urls(
      country = country,
      gender = "M",
      season_end_year = 2024,
      tier = "1st"
    )
    
    if (length(league_urls) > 0) {
      cat("  ✅ Found league URL\n")
      
      # Вземи мачовете - подавай gender и season
      matches <- fb_match_results(
        league_urls[1],
        gender = "M",
        season_end_year = 2024
      )
      
      cat(sprintf("  ✅ Found %d matches\n", nrow(matches)))
      
      if (nrow(matches) > 0) {
        league_name <- unique(matches$Comp)[1]
        
        leagues_index[[country]] <- list(
          name = as.character(league_name),
          country = country,
          matches_count = nrow(matches)
        )
        
        # Добави последните 5 мача
        for (j in 1:min(5, nrow(matches))) {
          all_matches[[length(all_matches) + 1]] <- list(
            date = as.character(matches$Date[j]),
            home_team = as.character(matches$Home[j]),
            away_team = as.character(matches$Away[j]),
            home_score = as.numeric(matches$HomeGoals[j]),
            away_score = as.numeric(matches$AwayGoals[j]),
            competition = as.character(league_name),
            country = country
          )
        }
      }
    } else {
      cat("  ⚠️ No league URL found\n")
    }
    
    Sys.sleep(2)
    
  }, error = function(e) {
    cat("  ❌ ERROR:", e$message, "\n")
  })
}

# Записване
cat("\n💾 Saving JSON files...\n")

write_json(leagues_index, "data/leagues_index.json", pretty = TRUE, auto_unbox = TRUE)
write_json(all_matches, "data/all_matches.json", pretty = TRUE, auto_unbox = TRUE)

cat(sprintf("  ✅ leagues_index.json - %d leagues\n", length(leagues_index)))
cat(sprintf("  ✅ all_matches.json - %d matches\n", length(all_matches)))

cat("\n✅ FETCH ALL LEAGUES - COMPLETED\n")
cat("========================================\n")