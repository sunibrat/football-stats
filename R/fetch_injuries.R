#!/usr/bin/env Rscript

# Auto-install packages if missing
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

# Create data folder if it doesn't exist
if (!dir.exists("data")) dir.create("data")

# List of countries for Transfermarkt
countries_tm <- c(
  "England", "Spain", "Italy", "Germany", "France", 
  "Netherlands", "Portugal", "Belgium", "Turkey", 
  "Greece", "Russia", "Ukraine", "Croatia", "Switzerland",
  "Austria", "Scotland", "Poland", "Czech Republic", 
  "Brazil", "Argentina", "USA", "Mexico", "Japan",
  "South Korea", "China", "Australia"
)

all_injuries <- data.frame()

for (i in seq_along(countries_tm)) {
  country <- countries_tm[i]
  cat(sprintf("\n[%d/%d] 🚑 Processing %s...\n", i, length(countries_tm), country))
  
  tryCatch({
    # Get injuries for the league
    injuries <- tm_league_injuries(
      country_name = country, 
      start_year = 2025,
      league_url = NULL  # automatically gets first division
    )
    
    if (!is.null(injuries) && nrow(injuries) > 0) {
      # Add country column
      injuries$country <- country
      injuries$fetch_date <- as.character(Sys.Date())
      
      # Merge with existing data
      if (nrow(all_injuries) == 0) {
        all_injuries <- injuries
      } else {
        all_injuries <- bind_rows(all_injuries, injuries)
      }
      
      cat(sprintf("  ✅ %d injured players\n", nrow(injuries)))
    } else {
      cat("  ⚠️ No injury data available\n")
    }
    
    # Wait between requests
    Sys.sleep(3)
    
  }, error = function(e) {
    cat(sprintf("  ❌ Error: %s\n", e$message))
  })
}

# Save JSON file
if (nrow(all_injuries) > 0) {
  # Clean data (remove duplicates)
  all_injuries <- all_injuries %>%
    distinct(player_name, club, injury, .keep_all = TRUE)
  
  # Save as JSON
  write_json(all_injuries, "data/injuries.json", pretty = TRUE, auto_unbox = TRUE)
  cat(sprintf("\n✅ Saved %d injured players to data/injuries.json\n", nrow(all_injuries)))
  
  # Show sample
  cat("\n📋 Sample data:\n")
  print(head(all_injuries[, c("player_name", "club", "injury", "country")], 5))
  
} else {
  cat("\n⚠️ No injured players found\n")
  # Create empty JSON file
  write_json(list(), "data/injuries.json", pretty = TRUE)
}

cat("\n========================================\n")
cat("✅ FETCH INJURIES - COMPLETED\n")
cat("========================================\n")