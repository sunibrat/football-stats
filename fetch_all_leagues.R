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

if (!dir.exists("data")) dir.create("data")

teams <- c("Real Madrid", "Barcelona", "Manchester City", "Liverpool")
all_injuries <- list()

for (team in teams) {
  cat(sprintf("\n🚑 Checking %s...\n", team))
  tryCatch({
    team_url <- tm_team_transfermarkt_url(team_name = team)
    if (!is.null(team_url)) {
      injuries <- tm_squad_injuries(team_url = team_url)
      if (nrow(injuries) > 0) {
        injuries$team <- team
        all_injuries[[team]] <- injuries
      }
    }
    Sys.sleep(2)
  }, error = function(e) {
    cat("  ❌ ERROR:", e$message, "\n")
  })
}

if (length(all_injuries) > 0) {
  injuries_df <- bind_rows(all_injuries)
  write_json(injuries_df, "data/injuries.json", pretty = TRUE, auto_unbox = TRUE)
} else {
  write_json(list(), "data/injuries.json", pretty = TRUE)
}

cat("\n✅ FETCH INJURIES - COMPLETED\n")
cat("========================================\n")