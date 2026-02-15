#!/usr/bin/env Rscript

options(repos = c(CRAN = "https://cloud.r-project.org"))

if (!require("worldfootballR")) install.packages("worldfootballR")
if (!require("jsonlite")) install.packages("jsonlite")
if (!require("dplyr")) install.packages("dplyr")

library(worldfootballR)
library(jsonlite)
library(dplyr)

cat("========================================\n")
cat("🚑 FETCH INJURIES - START\n")
cat("========================================\n")

# Създаване на папка data
if (!dir.exists("data")) dir.create("data")

# Вземи контузени за топ отбори
teams <- c(
  "Real Madrid", "Barcelona", "Manchester City", "Liverpool", 
  "Bayern Munich", "Paris Saint-Germain", "Juventus", "Milan",
  "Inter", "Arsenal", "Chelsea", "Manchester United"
)

all_injuries <- list()

for (team in teams) {
  cat(sprintf("\n🚑 Checking %s...\n", team))
  
  tryCatch({
    # Търси отбора в Transfermarkt
    team_url <- tm_team_transfermarkt_url(team_name = team)
    
    if (!is.null(team_url) && length(team_url) > 0) {
      # Вземи контузени
      injuries <- tm_squad_injuries(team_url = team_url)
      
      if (!is.null(injuries) && nrow(injuries) > 0) {
        injuries$team <- team
        injuries$fetch_date <- as.character(Sys.Date())
        
        all_injuries[[team]] <- injuries
        cat(sprintf("  ✅ Found %d injured players\n", nrow(injuries)))
      } else {
        cat("  ⚠️ No injuries found\n")
      }
    }
    
    Sys.sleep(2)
    
  }, error = function(e) {
    cat("  ❌ ERROR:", e$message, "\n")
  })
}

# Записване
cat("\n💾 Saving injuries.json...\n")

if (length(all_injuries) > 0) {
  injuries_df <- bind_rows(all_injuries)
  write_json(injuries_df, "data/injuries.json", pretty = TRUE, auto_unbox = TRUE)
  cat(sprintf("  ✅ Saved %d injuries\n", nrow(injuries_df)))
} else {
  write_json(list(), "data/injuries.json", pretty = TRUE)
  cat("  ⚠️ No injuries data\n")
}

cat("\n✅ FETCH INJURIES - COMPLETED\n")
cat("========================================\n")