#!/usr/bin/env Rscript

# Автоматично инсталиране на пакети
options(repos = c(CRAN = "https://cloud.r-project.org"))

if (!require("worldfootballR")) install.packages("worldfootballR")
if (!require("jsonlite")) install.packages("jsonlite")
if (!require("dplyr")) install.packages("dplyr")

library(worldfootballR)
library(jsonlite)
library(dplyr)

cat("========================================\n")
cat("🚀 FETCH ALL LEAGUES - СТАРТ\n")
cat("========================================\n")

# Създаване на папка data ако не съществува
if (!dir.exists("data")) dir.create("data")

# Списък с държави (всички лиги от цял свят)
countries <- c(
  # Европа
  "ENG", "ESP", "ITA", "GER", "FRA", "NED", "POR", "BEL", "TUR", "GRE", "RUS",
  "UKR", "CRO", "DEN", "SUI", "AUT", "SCO", "POL", "CZE", "NOR", "SWE", "BUL", 
  "ROU", "SRB", "HUN", "ISR", "CYP", "BLR", "KAZ", "AZE", "GEO", "ARM", "LVA",
  "LTU", "EST", "ALB", "MKD", "SVN", "SVK", "BIH", "MNE", "KOS", "LUX", "MLT",
  "ISL", "IRL", "NIR", "WAL",
  # Северна Америка
  "USA", "MEX", "CAN",
  # Южна Америка
  "BRA", "ARG", "URU", "CHI", "COL", "PAR", "PER", "ECU", "BOL", "VEN",
  # Азия
  "JPN", "KOR", "CHN", "KSA", "UAE", "AUS", "QAT", "IRN", "IRQ", "JOR", "SYR",
  "LIB", "OMA", "BHR", "KUW", "YEM", "IND", "THA", "VIE", "IDN", "MAS", "SIN",
  "PHI", "MYA", "CAM", "LAO", "TLS",
  # Африка
  "EGY", "TUN", "MAR", "RSA", "ALG", "NGA", "SEN", "CMR", "GHA", "CIV", "MLI",
  "BFA", "GUI", "BEN", "TOG", "SLE", "LBR", "CTA", "CHA", "NIG", "SUD", "ERI",
  "ETH", "DJI", "SOM", "UGA", "KEN", "TAN", "RWA", "BDI", "MOZ", "MAD", "COM",
  "SEY", "MRI", "CPV", "STP", "GNB", "GAM", "GNQ", "GAB", "COG", "COD", "ANG",
  "ZAM", "ZIM", "MAW", "MOZ", "BOT", "NAM", "SWZ", "LES"
)

season <- 2026
all_matches <- list()
leagues_index <- list()

for (i in seq_along(countries)) {
  country <- countries[i]
  cat(sprintf("\n[%d/%d] 📊 Обработвам %s...\n", i, length(countries), country))
  
  tryCatch({
    # Вземи URL за първа дивизия
    league_urls <- fb_league_urls(
      country = country,
      gender = "M",
      season_end_year = season,
      tier = "1st"
    )
    
    if (length(league_urls) > 0) {
      # Вземи мачовете за лигата
      matches <- fb_match_results(league_urls[1])
      
      # Добави в индекса
      leagues_index[[country]] <- list(
        name = unique(matches$Comp)[1],
        country = country,
        matches_count = nrow(matches)
      )
      
      # Добави мачовете (само последните 10)
      for (j in 1:min(10, nrow(matches))) {
        all_matches <- append(all_matches, list(list(
          date = as.character(matches$Date[j]),
          home_team = matches$Home[j],
          away_team = matches$Away[j],
          home_score = matches$HomeGoals[j],
          away_score = matches$AwayGoals[j],
          competition = matches$Comp[j],
          country = country,
          match_url = matches$MatchURL[j]
        )))
      }
      
      cat(sprintf("  ✅ %s - %d мача\n", unique(matches$Comp)[1], nrow(matches)))
      
      # Изчакване между заявките
      Sys.sleep(2)
    } else {
      cat(sprintf("  ⚠️ Няма данни за %s\n", country))
    }
  }, error = function(e) {
    cat(sprintf("  ❌ Грешка: %s\n", e$message))
  })
}

# Записване на JSON файлове
cat("\n💾 Записвам JSON файлове...\n")

# Индекс на лигите
write_json(leagues_index, "data/leagues_index.json", pretty = TRUE, auto_unbox = TRUE)
cat(sprintf("  ✅ data/leagues_index.json - %d лиги\n", length(leagues_index)))

# Всички мачове
write_json(all_matches, "data/all_matches.json", pretty = TRUE, auto_unbox = TRUE)
cat(sprintf("  ✅ data/all_matches.json - %d мача\n", length(all_matches)))

cat("\n========================================\n")
cat("✅ FETCH ALL LEAGUES - ЗАВЪРШЕН\n")
cat("========================================\n")