// Champion pool data (manually entered for now)
const championPool = {
  1: 30, // Used to be 22
  2: 25, // Used to be 20
  3: 18, // Used to be 17
  4: 10, 
  5: 9, 
  6: 9
};

// Unique champion count per tier
const uniqueChampions = {
  1: 14, 
  2: 13, 
  3: 13, 
  4: 12, 
  5: 8, 
  6: 3
};

// Shop probabilities based on player level
const shopOdds = {
  1: [100, 0, 0, 0, 0],
  2: [100, 0, 0, 0, 0],
  3: [75, 25, 0, 0, 0],
  4: [55, 30, 15, 0, 0],
  5: [45, 33, 20, 2, 0],
  6: [25, 40, 30, 5, 0],
  7: [20, 33, 36, 10, 1],
  8: [18, 25, 32, 22, 3],
  9: [15, 20, 25, 30, 10],
  10: [5, 10, 20, 40, 25]
};

let chartInstance;
let desiredChampionTier = 1; // Global variable to track the selected champion's tier
let desiredNumberOfChampions = 1; // Default to 1 champion



// Function to calculate the probability
function calculateProbability(level, refreshes, championCopiesInGame) {
  if (championCopiesInGame >= championPool[desiredChampionTier]) {
    return 0; // No champions left to draw
  }

  const tierOdds = shopOdds[level][desiredChampionTier - 1] / 100;
  const remainingChampionCopies = championPool[desiredChampionTier] - championCopiesInGame;
  const specificChampionOdds = remainingChampionCopies / championPool[desiredChampionTier];

  const slotProbability = tierOdds * specificChampionOdds;
  const noChampionInShop = Math.pow(1 - slotProbability, 5);
  const noChampionInAllShops = Math.pow(noChampionInShop, refreshes);
  const atLeastOneChampion = 1 - noChampionInAllShops;

  if (desiredNumberOfChampions <= 1) {
    return atLeastOneChampion * 100; // Single champion case
  }

  let cumulativeProbability = 0;
  for (let i = desiredNumberOfChampions; i <= refreshes; i++) {
    cumulativeProbability += binomialCoefficient(refreshes, i) * 
      Math.pow(atLeastOneChampion, i) * 
      Math.pow(1 - atLeastOneChampion, refreshes - i);
  }

  return Math.min(cumulativeProbability * 100, 100); // Cap at 100%
}

// Binomial coefficient function to calculate combinations
function binomialCoefficient(n, k) {
  if (k === 0 || k === n) return 1;
  if (k === 1 || k === n - 1) return n;
  if (k > n) return 0;
  return factorial(n) / (factorial(k) * factorial(n - k));
}

// Factorial function to calculate the factorial of a number
function factorial(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

// Function to update the chart with the selected champion's tier and desired champions
function updateChart(playerLevel, numShops, championCopiesInGame) {
  const levels = Array.from({ length: 10 }, (_, i) => i + 1);
  const probabilities = levels.map(level => 
    calculateProbability(level, numShops, championCopiesInGame)
  );

  const ctx = document.getElementById("probabilityChart").getContext("2d");
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: levels,
      datasets: [{
        label: "Probability (%)",
        data: probabilities,
        borderWidth: 2,
        pointBackgroundColor: levels.map(level => (level === playerLevel ? "red" : "white")),
        borderColor: "white",
        pointRadius: levels.map(level => (level === playerLevel ? 6 : 4)),
        fill: false,
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Levels", color: "white" },
          ticks: { color: "white" },
          grid: { color: "rgba(255, 255, 255, 0.2)" }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: "Probability (%)", color: "white" },
          ticks: { color: "white" },
          grid: { color: "rgba(255, 255, 255, 0.2)" },
        }
      }
    }
  });
}

// Event listener for slider changes
document.querySelectorAll(".slider-container input").forEach(slider => {
  slider.addEventListener("input", () => {
    const playerLevel = Math.max(1, parseInt(document.getElementById("levelSlider").value, 10));
    const numShops = Math.max(0, parseInt(document.getElementById("numShops").value, 10));
    const championCopiesInGame = Math.max(0, Math.min(
      parseInt(document.getElementById("championCopiesInGame").value, 10), 
      championPool[desiredChampionTier]
    ));

    const maxDesiredChampions = championPool[desiredChampionTier] - championCopiesInGame;
    desiredNumberOfChampions = Math.min(
      desiredNumberOfChampions,
      maxDesiredChampions
    );
    document.getElementById("desiredNumberOfChampionsSlider").max = maxDesiredChampions;
    document.getElementById("desiredNumberOfChampionsValue").textContent = desiredNumberOfChampions;

    document.getElementById("levelValue").textContent = playerLevel;
    document.getElementById("refreshValue").textContent = numShops;
    document.getElementById("copiesValue").textContent = championCopiesInGame;

    updateChart(playerLevel, numShops, championCopiesInGame);
  });
});

// Event listener for the desired number of champions slider
document.getElementById("desiredNumberOfChampionsSlider").addEventListener("input", () => {
  desiredNumberOfChampions = Math.max(1, parseInt(document.getElementById("desiredNumberOfChampionsSlider").value, 10));

  const playerLevel = Math.max(1, parseInt(document.getElementById("levelSlider").value, 10));
  const numShops = Math.max(0, parseInt(document.getElementById("numShops").value, 10));
  const championCopiesInGame = Math.max(0, Math.min(
    parseInt(document.getElementById("championCopiesInGame").value, 10), 
    championPool[desiredChampionTier]
  ));

  const maxDesiredChampions = championPool[desiredChampionTier] - championCopiesInGame;
  document.getElementById("desiredNumberOfChampionsSlider").max = maxDesiredChampions;
  document.getElementById("desiredNumberOfChampionsValue").textContent = desiredNumberOfChampions;

  updateChart(playerLevel, numShops, championCopiesInGame);
});

// Initial chart load with default values

updateChart(1, 0, 0);




// Search functionality
const searchInput = document.getElementById("champion-search");
const dropdown = document.getElementById("champion-dropdown");
const championImage = document.getElementById("champion-image");
const championCircle = document.querySelector(".champion-circle");




const championComp = [ 
  {
    compName: "Pit Fighter Violet",
    championsComp: [
      {
        name: "Violet",
        items: []
      },
      {
        name: "Vander",
        items: []
      },
      {
        name: "Draven",
        items: []
      },
      {
        name: "Powder",
        items: []
      },
      {
        name: "Vi",
        items: []
      },
      {
        name: "Gangplank",
        items: []
      },
      {
        name: "Urgot",
        items: []
      },
      {
        name: "Darius",
        items: []
      }
    ]
  },
  {
    compName: "Quickstriker Nocturne",
    championsComp: [
      {
        name: "Nocturne",
        items: []
      },
      {
        name: "Kog'Maw",
        items: []
      },
      {
        name: "Blitzcrank",
        items: []
      },
      {
        name: "Ambessa",
        items: []
      },
      {
        name: "Malzahar",
        items: []
      },
      {
        name: "Twisted Fate",
        items: []
      },
      {
        name: "Akali",
        items: []
      },
      {
        name: "Amumu",
        items: []
      }
    ]
  },
  {
    compName: "Sentinel Heimerdinger",
    championsComp: [
      {
        name: "Heimer",
        items: []
      },
      {
        name: "Illaoi",
        items: []
      },
      {
        name: "Corki",
        items: []
      },
      {
        name: "Rumble",
        items: []
      },
      {
        name: "Loris",
        items: []
      },
      {
        name: "Ezreal",
        items: []
      },
      {
        name: "Leona",
        items: []
      },
      {
        name: "Rell",
        items: []
      },
      {
        name: "Irelia",
        items: []
      }
    ]
  },
  {
    compName: "Automata Kog'Maw",
    championsComp: [
      {
        name: "Kog'Maw",
        items: []
      },
      {
        name: "Blitzcrank",
        items: []
      },
      {
        name: "Nocturne",
        items: []
      },
      {
        name: "Dr. Mundo",
        items: []
      },
      {
        name: "Silco",
        items: []
      },
      {
        name: "Cassiopeia",
        items: []
      },
      {
        name: "Ziggs",
        items: []
      },
      {
        name: "Amumu",
        items: []
      }
    ]
  },
  {
    compName: "Black Rose Silco",
    championsComp: [
      {
        name: "Silco",
        items: []
      },
      {
        name: "Dr. Mundo",
        items: []
      },
      {
        name: "Mordekaiser",
        items: []
      },
      {
        name: "Elise",
        items: []
      },
      {
        name: "LeBlanc",
        items: []
      },
      {
        name: "Garen",
        items: []
      },
      {
        name: "Cassiopeia",
        items: []
      },
      {
        name: "Vladimir",
        items: []
      },
      {
        name: "Morgana",
        items: []
      }
    ]
  },
  {
    compName: "Chem-Baron Silco",
    championsComp: [
      {
        name: "Silco",
        items: []
      },
      {
        name: "Renni",
        items: []
      },
      {
        name: "Sevika",
        items: []
      },
      {
        name: "Smeech",
        items: []
      },
      {
        name: "Dr. Mundo",
        items: []
      },
      {
        name: "Nunu",
        items: []
      },
      {
        name: "Renata Glasc",
        items: []
      },
      {
        name: "Singed",
        items: []
      }
    ]
  },
  {
    compName: "Rebel Illaoi",
    championsComp: [
      {
        name: "Illaoi",
        items: []
      },
      {
        name: "Zoe",
        items: []
      },
      {
        name: "Jinx",
        items: []
      },
      {
        name: "Sett",
        items: []
      },
      {
        name: "Rumble",
        items: []
      },
      {
        name: "Ekko",
        items: []
      },
      {
        name: "Ezreal",
        items: []
      },
      {
        name: "Akali",
        items: []
      },
      {
        name: "Irelia",
        items: []
      }
    ]
  },
  {
    compName: "Ambusher Illaoi",
    championsComp: [
      {
        name: "Jinx",
        items: []
      },
      {
        name: "Illaoi",
        items: []
      },
      {
        name: "Ekko",
        items: []
      },
      {
        name: "Rumble",
        items: []
      },
      {
        name: "Malzahar",
        items: []
      },
      {
        name: "Mordekaiser",
        items: []
      },
      {
        name: "Blitzcrank",
        items: []
      },
      {
        name: "Rell",
        items: []
      },
      {
        name: "Irelia",
        items: []
      }
    ]
  },
  {
    compName: "Emissary Garen",
    championsComp: [
      {
        name: "Garen",
        items: []
      },
      {
        name: "Tristana",
        items: []
      },
      {
        name: "Corki",
        items: []
      },
      {
        name: "Ambessa",
        items: []
      },
      {
        name: "Ezreal",
        items: []
      },
      {
        name: "Nami",
        items: []
      },
      {
        name: "Rell",
        items: []
      },
      {
        name: "Urgot",
        items: []
      }
    ]
  },
  {
    compName: "Form Swapper Swain",
    championsComp: [
      {
        name: "Gangplank",
        items: []
      },
      {
        name: "Swain",
        items: []
      },
      {
        name: "Elise",
        items: []
      },
      {
        name: "Jayce",
        items: []
      },
      {
        name: "Vi",
        items: []
      },
      {
        name: "Nami",
        items: []
      },
      {
        name: "Nunu",
        items: []
      },
      {
        name: "Rell",
        items: []
      }
    ]
  },
  {
    compName: "Bruiser Twitch",
    championsComp: [
      {
        name: "Twitch",
        items: []
      },
      {
        name: "Dr. Mundo",
        items: []
      },
      {
        name: "Elise",
        items: []
      },
      {
        name: "Caitlyn",
        items: []
      },
      {
        name: "Renni",
        items: []
      },
      {
        name: "Nunu",
        items: []
      },
      {
        name: "Sett",
        items: []
      },
      {
        name: "Steb",
        items: []
      },
      {
        name: "Trundle",
        items: []
      }
    ]
  },
  {
    compName: "Enforcer Loris",
    championsComp: [
      {
        name: "Loris",
        items: []
      },
      {
        name: "Caitlyn",
        items: []
      },
      {
        name: "Vi",
        items: []
      },
      {
        name: "Twisted Fate",
        items: []
      },
      {
        name: "Sevika",
        items: []
      },
      {
        name: "Rumble",
        items: []
      },
      {
        name: "Camille",
        items: []
      },
      {
        name: "Steb",
        items: []
      },
      {
        name: "Maddie",
        items: []
      }
    ]
  },
  {
    compName: "Scrap Corki",
    championsComp: [
      {
        name: "Corki",
        items: []
      },
      {
        name: "Ekko",
        items: []
      },
      {
        name: "Rumble",
        items: []
      },
      {
        name: "Powder",
        items: []
      },
      {
        name: "Elise",
        items: []
      },
      {
        name: "Illaoi",
        items: []
      },
      {
        name: "Gangplank",
        items: []
      },
      {
        name: "Tristana",
        items: []
      },
      {
        name: "Trundle",
        items: []
      }
    ]
  },
  {
    compName: "Emissary Garen Swain",
    championsComp: [
      {
        name: "Garen",
        items: []
      },
      {
        name: "Swain",
        items: []
      },
      {
        name: "Nami",
        items: []
      },
      {
        name: "Ambessa",
        items: []
      },
      {
        name: "LeBlanc",
        items: []
      },
      {
        name: "Elise",
        items: []
      },
      {
        name: "Tristana",
        items: []
      },
      {
        name: "Vladimir",
        items: []
      }
    ]
  },
  {
    compName: "Ambusher Powder",
    championsComp: [
      {
        name: "Powder",
        items: []
      },
      {
        name: "Vander",
        items: []
      },
      {
        name: "Ekko",
        items: []
      },
      {
        name: "Camille",
        items: []
      },
      {
        name: "Jinx",
        items: []
      },
      {
        name: "Scar",
        items: []
      },
      {
        name: "Smeech",
        items: []
      },
      {
        name: "Violet",
        items: []
      }
    ]
  },
  {
    compName: "Sentinel Tristana",
    championsComp: [
      {
        name: "Tristana",
        items: []
      },
      {
        name: "Corki",
        items: []
      },
      {
        name: "Illaoi",
        items: []
      },
      {
        name: "Rell",
        items: []
      },
      {
        name: "Ezreal",
        items: []
      },
      {
        name: "Leona",
        items: []
      },
      {
        name: "Urgot",
        items: []
      },
      {
        name: "Irelia",
        items: []
      }
    ]
  },
  {
    compName: "Pit Fighter Vi",
    championsComp: [
      {
        name: "Vi",
        items: []
      },
      {
        name: "Sevika",
        items: []
      },
      {
        name: "Gangplank",
        items: []
      },
      {
        name: "Urgot",
        items: []
      },
      {
        name: "Corki",
        items: []
      },
      {
        name: "Ezreal",
        items: []
      },
      {
        name: "Tristana",
        items: []
      },
      {
        name: "Draven",
        items: []
      },
      {
        name: "Violet",
        items: []
      }
    ]
  },
  {
    compName: "Conqueror Ambessa",
    championsComp: [
      {
        name: "Ambessa",
        items: []
      },
      {
        name: "Garen",
        items: []
      },
      {
        name: "Mordekaiser",
        items: []
      },
      {
        name: "Swain",
        items: []
      },
      {
        name: "Nami",
        items: []
      },
      {
        name: "Rell",
        items: []
      },
      {
        name: "Tristana",
        items: []
      },
      {
        name: "Darius",
        items: []
      },
      {
        name: "Draven",
        items: []
      }
    ]
  },
  {
    compName: "Watcher Kog'Maw",
    championsComp: [
      {
        name: "Kog'Maw",
        items: []
      },
      {
        name: "Scar",
        items: []
      },
      {
        name: "Zeri",
        items: []
      },
      {
        name: "Garen",
        items: []
      },
      {
        name: "Vander",
        items: []
      },
      {
        name: "Vladimir",
        items: []
      },
      {
        name: "Amumu",
        items: []
      },
      {
        name: "Darius",
        items: []
      }
    ]
  },
  {
    compName: "Dominator Silco",
    championsComp: [
      {
        name: "Silco",
        items: []
      },
      {
        name: "Dr. Mundo",
        items: []
      },
      {
        name: "Mordekaiser",
        items: []
      },
      {
        name: "Ziggs",
        items: []
      },
      {
        name: "Twitch",
        items: []
      },
      {
        name: "Blitzcrank",
        items: []
      },
      {
        name: "Cassiopeia",
        items: []
      },
      {
        name: "Nunu",
        items: []
      }
    ]
  },
  {
    compName: "Emissary Ambessa",
    championsComp: [
      {
        name: "Ambessa",
        items: []
      },
      {
        name: "Corki",
        items: []
      },
      {
        name: "Garen",
        items: []
      },
      {
        name: "Gangplank",
        items: []
      },
      {
        name: "Vi",
        items: []
      },
      {
        name: "Nami",
        items: []
      },
      {
        name: "Swain",
        items: []
      },
      {
        name: "Twisted Fate",
        items: []
      },
      {
        name: "Tristana",
        items: []
      }
    ]
  },
  {
    compName: "Quickstriker Akali",
    championsComp: [
      {
        name: "Akali",
        items: []
      },
      {
        name: "Nocturne",
        items: []
      },
      {
        name: "Twisted Fate",
        items: []
      },
      {
        name: "Ambessa",
        items: []
      },
      {
        name: "Illaoi",
        items: []
      },
      {
        name: "Loris",
        items: []
      },
      {
        name: "Rell",
        items: []
      },
      {
        name: "Irelia",
        items: []
      }
    ]
  },
  {
    compName: "Black Rose Dr. Mundo",
    championsComp: [
      {
        name: "Dr. Mundo",
        items: []
      },
      {
        name: "Twitch",
        items: []
      },
      {
        name: "LeBlanc",
        items: []
      },
      {
        name: "Elise",
        items: []
      },
      {
        name: "Garen",
        items: []
      },
      {
        name: "Cassiopeia",
        items: []
      },
      {
        name: "Nunu",
        items: []
      },
      {
        name: "Vladimir",
        items: []
      },
      {
        name: "Morgana",
        items: []
      }
    ]
  },
  {
    compName: "Pit Fighter Gangplank",
    championsComp: [
      {
        name: "Gangplank",
        items: []
      },
      {
        name: "Swain",
        items: []
      },
      {
        name: "Vi",
        items: []
      },
      {
        name: "Sevika",
        items: []
      },
      {
        name: "Jayce",
        items: []
      },
      {
        name: "Elise",
        items: []
      },
      {
        name: "Urgot",
        items: []
      },
      {
        name: "Draven",
        items: []
      },
      {
        name: "Violet",
        items: []
      }
    ]
  },
  {
    compName: "Automata Kog'Maw Twitch",
    championsComp: [
      {
        name: "Kog'Maw",
        items: []
      },
      {
        name: "Twitch",
        items: []
      },
      {
        name: "Blitzcrank",
        items: []
      },
      {
        name: "Dr. Mundo",
        items: []
      },
      {
        name: "Malzahar",
        items: []
      },
      {
        name: "Nunu",
        items: []
      },
      {
        name: "Nocturne",
        items: []
      },
      {
        name: "Amumu",
        items: []
      }
    ]
  },
  {
    compName: "Black Rose Heimerdinger",
    championsComp: [
      {
        name: "Heimer",
        items: []
      },
      {
        name: "Garen",
        items: []
      },
      {
        name: "Malzahar",
        items: []
      },
      {
        name: "Elise",
        items: []
      },
      {
        name: "LeBlanc",
        items: []
      },
      {
        name: "Cassiopeia",
        items: []
      },
      {
        name: "Nunu",
        items: []
      },
      {
        name: "Vladimir",
        items: []
      },
      {
        name: "Morgana",
        items: []
      }
    ]
  },
  {
    compName: "Conqueror Swain",
    championsComp: [
      {
        name: "Swain",
        items: []
      },
      {
        name: "Ambessa",
        items: []
      },
      {
        name: "Mordekaiser",
        items: []
      },
      {
        name: "Draven",
        items: []
      },
      {
        name: "Sevika",
        items: []
      },
      {
        name: "Vi",
        items: []
      },
      {
        name: "Gangplank",
        items: []
      },
      {
        name: "Rell",
        items: []
      },
      {
        name: "Darius",
        items: []
      }
    ]
  },
  {
    compName: "Academy Heimerdinger Jayce",
    championsComp: [
      {
        name: "Heimer",
        items: []
      },
      {
        name: "Jayce",
        items: []
      },
      {
        name: "Leona",
        items: []
      },
      {
        name: "Malzahar",
        items: []
      },
      {
        name: "Rumble",
        items: []
      },
      {
        name: "Elise",
        items: []
      },
      {
        name: "Illaoi",
        items: []
      },
      {
        name: "Nunu",
        items: []
      },
      {
        name: "Rell",
        items: []
      }
    ]
  },
  {
    compName: "Visionary Heimerdinger Renata Glasc",
    championsComp: [
      {
        name: "Heimer",
        items: []
      },
      {
        name: "Renata Glasc",
        items: []
      },
      {
        name: "Illaoi",
        items: []
      },
      {
        name: "Malzahar",
        items: []
      },
      {
        name: "Nunu",
        items: []
      },
      {
        name: "Rell",
        items: []
      },
      {
        name: "Morgana",
        items: []
      },
      {
        name: "Vex",
        items: []
      }
    ]
  },
  {
    compName: "Quickstriker Ambessa",
    championsComp: [
      {
        name: "Ambessa",
        items: []
      },
      {
        name: "Garen",
        items: []
      },
      {
        name: "Nocturne",
        items: []
      },
      {
        name: "Akali",
        items: []
      },
      {
        name: "Nami",
        items: []
      },
      {
        name: "Twisted Fate",
        items: []
      },
      {
        name: "Tristana",
        items: []
      },
      {
        name: "Amumu",
        items: []
      }
    ]
  },
  {
    compName: "Experiment Dr. Mundo Twitch",
    championsComp: [
      {
        name: "Dr. Mundo",
        items: []
      },
      {
        name: "Twitch",
        items: []
      },
      {
        name: "Urgot",
        items: []
      },
      {
        name: "Sevika",
        items: []
      },
      {
        name: "Vi",
        items: []
      },
      {
        name: "Gangplank",
        items: []
      },
      {
        name: "Nunu",
        items: []
      },
      {
        name: "Zyra",
        items: []
      }
    ]
  },
  {
    compName: "Academy Leona",
    championsComp: [
      {
        name: "Leona",
        items: []
      },
      {
        name: "Ezreal",
        items: []
      },
      {
        name: "Heimer",
        items: []
      },
      {
        name: "Corki",
        items: []
      },
      {
        name: "Jayce",
        items: []
      },
      {
        name: "Tristana",
        items: []
      },
      {
        name: "Urgot",
        items: []
      },
      {
        name: "Lux",
        items: []
      }
    ]
  },
  {
    compName: "Sorcerer Swain",
    championsComp: [
      {
        name: "Swain",
        items: []
      },
      {
        name: "Zoe",
        items: []
      },
      {
        name: "LeBlanc",
        items: []
      },
      {
        name: "Elise",
        items: []
      },
      {
        name: "Nami",
        items: []
      },
      {
        name: "Vladimir",
        items: []
      },
      {
        name: "Lux",
        items: []
      },
      {
        name: "Zyra",
        items: []
      }
    ]
  },
  {
    compName: "Academy Heimerdinger",
    championsComp: [
      {
        name: "Heimer",
        items: []
      },
      {
        name: "Leona",
        items: []
      },
      {
        name: "Ezreal",
        items: []
      },
      {
        name: "Jayce",
        items: []
      },
      {
        name: "Illaoi",
        items: []
      },
      {
        name: "Loris",
        items: []
      },
      {
        name: "Rell",
        items: []
      },
      {
        name: "Lux",
        items: []
      }
    ]
  },
  {
    compName: "Scrap Ziggs",
    championsComp: [
      {
        name: "Ziggs",
        items: []
      },
      {
        name: "Dr. Mundo",
        items: []
      },
      {
        name: "Ekko",
        items: []
      },
      {
        name: "Blitzcrank",
        items: []
      },
      {
        name: "Corki",
        items: []
      },
      {
        name: "Silco",
        items: []
      },
      {
        name: "Gangplank",
        items: []
      },
      {
        name: "Trundle",
        items: []
      }
    ]
  },
  {
    compName: "Sentinel Illaoi",
    championsComp: [
      {
        name: "Illaoi",
        items: []
      },
      {
        name: "Twitch",
        items: []
      },
      {
        name: "Loris",
        items: []
      },
      {
        name: "Maddie",
        items: []
      },
      {
        name: "Leona",
        items: []
      },
      {
        name: "Rell",
        items: []
      },
      {
        name: "Irelia",
        items: []
      },
      {
        name: "Singed",
        items: []
      }
    ]
  },
  {
    compName: "Experiment Dr. Mundo",
    championsComp: [
      {
        name: "Dr. Mundo",
        items: []
      },
      {
        name: "Twitch",
        items: []
      },
      {
        name: "Urgot",
        items: []
      },
      {
        name: "Corki",
        items: []
      },
      {
        name: "Ezreal",
        items: []
      },
      {
        name: "Nunu",
        items: []
      },
      {
        name: "Tristana",
        items: []
      },
      {
        name: "Zyra",
        items: []
      }
    ]
  },
  {
    compName: "Visionary Heimerdinger",
    championsComp: [
      {
        name: "Heimer",
        items: []
      },
      {
        name: "Elise",
        items: []
      },
      {
        name: "Malzahar",
        items: []
      },
      {
        name: "Nunu",
        items: []
      },
      {
        name: "LeBlanc",
        items: []
      },
      {
        name: "Rell",
        items: []
      },
      {
        name: "Renata Glasc",
        items: []
      },
      {
        name: "Morgana",
        items: []
      },
      {
        name: "Vex",
        items: []
      }
    ]
  },
  {
    compName: "Pit Fighter Urgot",
    championsComp: [
      {
        name: "Urgot",
        items: []
      },
      {
        name: "Sett",
        items: []
      },
      {
        name: "Tristana",
        items: []
      },
      {
        name: "Nunu",
        items: []
      },
      {
        name: "Sevika",
        items: []
      },
      {
        name: "Vi",
        items: []
      },
      {
        name: "Gangplank",
        items: []
      },
      {
        name: "Zyra",
        items: []
      }
    ]
  },
  {
    compName: "Ambusher Camille",
    championsComp: [
      {
        name: "Camille",
        items: []
      },
      {
        name: "Ekko",
        items: []
      },
      {
        name: "Smeech",
        items: []
      },
      {
        name: "Garen",
        items: []
      },
      {
        name: "Jinx",
        items: []
      },
      {
        name: "Loris",
        items: []
      },
      {
        name: "Scar",
        items: []
      },
      {
        name: "Powder",
        items: []
      }
    ]
  },
  {
    compName: "Bruiser Renni",
    championsComp: [
      {
        name: "Renni",
        items: []
      },
      {
        name: "Elise",
        items: []
      },
      {
        name: "Maddie",
        items: []
      },
      {
        name: "Nunu",
        items: []
      },
      {
        name: "Twitch",
        items: []
      },
      {
        name: "Sett",
        items: []
      },
      {
        name: "Steb",
        items: []
      },
      {
        name: "Trundle",
        items: []
      }
    ]
  },
  {
    compName: "Rebel Irelia",
    championsComp: [
      {
        name: "Irelia",
        items: []
      },
      {
        name: "Illaoi",
        items: []
      },
      {
        name: "Zoe",
        items: []
      },
      {
        name: "Ezreal",
        items: []
      },
      {
        name: "Akali",
        items: []
      },
      {
        name: "Rell",
        items: []
      },
      {
        name: "Sett",
        items: []
      },
      {
        name: "Vex",
        items: []
      }
    ]
  },
  {
    compName: "Sentinel Lux",
    championsComp: [
      {
        name: "Lux",
        items: []
      },
      {
        name: "Leona",
        items: []
      },
      {
        name: "Illaoi",
        items: []
      },
      {
        name: "Singed",
        items: []
      },
      {
        name: "Loris",
        items: []
      },
      {
        name: "Ezreal",
        items: []
      },
      {
        name: "Rell",
        items: []
      },
      {
        name: "Irelia",
        items: []
      }
    ]
  },
  {
    compName: "Emissary Illaoi",
    championsComp: [
      {
        name: "Illaoi",
        items: []
      },
      {
        name: "Twitch",
        items: []
      },
      {
        name: "Dr. Mundo",
        items: []
      },
      {
        name: "Garen",
        items: []
      },
      {
        name: "Ambessa",
        items: []
      },
      {
        name: "Ekko",
        items: []
      },
      {
        name: "Elise",
        items: []
      },
      {
        name: "Vi",
        items: []
      }
    ]
  },
  {
    compName: "Watcher Vladimir",
    championsComp: [
      {
        name: "Vladimir",
        items: []
      },
      {
        name: "Garen",
        items: []
      },
      {
        name: "Vander",
        items: []
      },
      {
        name: "Scar",
        items: []
      },
      {
        name: "Amumu",
        items: []
      },
      {
        name: "Powder",
        items: []
      },
      {
        name: "Darius",
        items: []
      },
      {
        name: "Violet",
        items: []
      }
    ]
  },
  {
    compName: "Chem-Baron Renni",
    championsComp: [
      {
        name: "Renni",
        items: []
      },
      {
        name: "Silco",
        items: []
      },
      {
        name: "Renata Glasc",
        items: []
      },
      {
        name: "Smeech",
        items: []
      },
      {
        name: "Heimer",
        items: []
      },
      {
        name: "Nunu",
        items: []
      },
      {
        name: "Rell",
        items: []
      },
      {
        name: "Singed",
        items: []
      }
    ]
  }
] 





const championAbilities = [ 
  {
    name: "Viktor",
    "link": "https://www.metatft.com/units/Viktor",
    ability: {
      AbilityDescription: "<spellpassive>Passive:</spellpassive> Attacks are replaced with a Death Ray that deals <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDeathRayDamage\">70/175/2000</span>&nbsp;(<img src=\"/images/championStatImages/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage and <truedamage><span classname=\"UnitAbilityDescVar LaserTrueDamage\">35/90/1000</span></truedamage> true damage in a <span classname=\"UnitAbilityDescVar LaserHexLength\">2</span>-hex line. Enemies hit are 30% <tftkeyword>Sundered</tftkeyword> and <tftkeyword>Shredded</tftkeyword> for <span classname=\"UnitAbilityDescVar ShredDuration\">5</span>&nbsp;seconds.<br><br><spellactive>Active:</spellactive> Summon a chaos storm that engulfs the battlefield, knocking up ALL enemies into the air for <span classname=\"UnitAbilityDescVar StunDuration\">2/3/30</span> seconds. At the end of the duration, slam them to the ground, dealing <magicdamage><span classname=\"UnitAbilityDescVar ModifiedSpellDamage\">120/300/9999</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> plus <magicdamage><span classname=\"UnitAbilityDescVar PercentMaxHealthDamage\">8/20/100</span>%</magicdamage> of their max Health as magic&nbsp;damage.<br><br><rules><tftbold>Sunder:</tftbold> Reduce Armor,</rules> <rules><tftbold>Shred:</tftbold> Reduce Magic Resist</rules>",
      icon: "https://cdn.metatft.com/file/metatft/champions/viktor_passive.png",
      name: "Chaos Storm"
    }
  },
  {
    name: "Mel",
    "link": "https://www.metatft.com/units/MissMage",
    ability: {
      AbilityDescription: "Dash to a nearby hex, then gain <tftbonus><span classname=\"UnitAbilityDescVar ShieldAmount\">300/600/10000</span></tftbonus> Shield and grant the same Shield to <span classname=\"UnitAbilityDescVar ShieldCount\">2</span> nearby allies. <span classname=\"UnitAbilityDescVar DRConvertToUnstableEnergy\">50</span>% of the damage blocked by the Shields is stored as unstable energy. After dashing, deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">180/450/2700</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to <span classname=\"UnitAbilityDescVar NormalCastNumEnemies\">3</span> nearby&nbsp;enemies. <br><br>Every 3rd cast, unleash the unstable energy + <magicdamage><span classname=\"UnitAbilityDescVar ModifiedSecondaryDamage\">1390/3475/99999</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> as magic damage split between the <span classname=\"UnitAbilityDescVar ThirdCastNumEnemies\">5</span> nearest&nbsp;enemies.",
      icon: "https://cdn.metatft.com/file/metatft/champions/tft13_missmage_spell.png",
      name: "Conduit of Magic"
    }
  },
  {
    name: "Warwick",
    "link": "https://www.metatft.com/units/Warwick",
    ability: {
      AbilityDescription: "<spellpassive>Passive:</spellpassive> While <omnivamp>Bloodfrenzied</omnivamp>, move faster, gain <tftbonus><span classname=\"UnitAbilityDescVar PercentOmnivamp\">0.2/0.25/1.1</span>%&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</tftbonus> Omnivamp, <tftbonus><span classname=\"UnitAbilityDescVar BloodfrenzyAS\">40</span>%</tftbonus> Attack Speed, and deal <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">360/807/6151</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\"><img src=\"/icons/AS.png\" alt=\"AS\" class=\"statIcon scaleASIcon\">)</physicaldamage> physical damage each second to target. After killing <span classname=\"UnitAbilityDescVar ChampsToDevourTooltipOnly\">5</span> enemies, become Unstoppable and <omnivamp>Bloodfrenzied</omnivamp> for the rest of&nbsp;combat.<br><br><spellactive>Active</spellactive>: Become <omnivamp>Bloodfrenzied</omnivamp> for <span classname=\"UnitAbilityDescVar BloodfrenzyDuration\">4</span>&nbsp;seconds.<br><br><spellactive enabled=\"TFT13_ExperimentActive\" alternate=\"rules\">Experiment Bonus:<tftbonus><showif.tft13_experimentactive></showif.tft13_experimentactive></tftbonus> On kill, Stun enemies adjacent to the dead target for 1&nbsp;second.</spellactive>",
      icon: "https://cdn.metatft.com/file/metatft/champions/tft13_warwick_abilityicon.png",
      name: "Blood Hunt"
    }
  },
  {
    name: "Sevika",
    "link": "https://www.metatft.com/units/Lieutenant",
    ability: {
      AbilityDescription: "Randomly cast 1 of 3 spells, with a chance of a Jackpot!<br><br><spellpassive>Flamethrower:</spellpassive> {{Spell_TFT13_LieutenantSpell1_Tooltip}}<br><br><spellpassive>Extendo-Punch:</spellpassive> {{Spell_TFT13_LieutenantSpell2_Tooltip}}<br><br><spellpassive>Chomp:</spellpassive> {{Spell_TFT13_LieutenantSpell3_Tooltip}}",
      icon: "https://cdn.metatft.com/file/metatft/champions/tft13_lieutenant_abilityicon.png",
      name: "Beat the Odds"
    }
  },
  {
    name: "Hextech Forge",
    "link": "https://www.metatft.com/units/JayceSummon",
    ability: {
      AbilityDescription: "Placeholder Tooltip",
      icon: "https://cdn.metatft.com/file/metatft/champions/eyeofthestorm.tft_set9.png",
      name: "Placeholder Name"
    }
  },
  {
    name: "Jayce",
    "link": "https://www.metatft.com/units/Jayce",
    ability: {
      AbilityDescription: "<spellpassive>Passive:</spellpassive> Summon a placeable Hextech Forge. On cast, the <span classname=\"UnitAbilityDescVar NumAlliesShield\">3</span> allies closest to it gain <tftbonus><span classname=\"UnitAbilityDescVar ModifiedShield\">200/275/1800</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</tftbonus> Shield for <span classname=\"UnitAbilityDescVar ShieldDuration\">4</span> seconds. If it's dead, revive it with <tftbonus><span classname=\"UnitAbilityDescVar ReducedSummonHealth\">100</span>%</tftbonus>&nbsp;Health.<br><br><spellactive>Active:</spellactive> Summon 2 Hexgates and knock target into one of them, dealing <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">250/375/2250</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage and sending them flying back to their original position. While flying, they deal <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedSecondaryDamage\">113/169/1688</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to all other enemies in the&nbsp;path.",
      icon: "https://cdn.metatft.com/file/metatft/champions/jayce_melee.png",
      name: "Special Delivery"
    }
  },
  {
    name: "Mordekaiser",
    "link": "https://www.metatft.com/units/Mordekaiser",
    ability: {
      AbilityDescription: "Briefly gain <tftbonus><span classname=\"UnitAbilityDescVar DR\">40</span>%</tftbonus> Durability and summon a massive claw, dealing <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">160/240/800</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to the most enemies in a line. The <span classname=\"UnitAbilityDescVar NearestEnemies\">4</span> closest enemies take <tftbonus><span classname=\"UnitAbilityDescVar DamageBonus\">25</span>%</tftbonus> more damage and are pulled towards&nbsp;Mordekaiser.<br><br>For the next <span classname=\"UnitAbilityDescVar EmpowerDuration\">10</span> seconds, gain <tftbonus><span classname=\"UnitAbilityDescVar OmnivampPercent\">30</span>%</tftbonus> Omnivamp, +1 Attack Range, and replace every attack with a slam that deals <magicdamage><span classname=\"UnitAbilityDescVar ModifiedTargetDamage\">330/500/3000</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to target and <magicdamage><span classname=\"UnitAbilityDescVar ModifiedSecondaryDamage\">85/125/1500</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to all other enemies within <span classname=\"UnitAbilityDescVar AttackHexRadius\">2</span>&nbsp;hexes.",
      icon: "https://cdn.metatft.com/file/metatft/champions/mordekaisere.png",
      name: "Grasp of the Iron Revenant"
    }
  },
  {
    name: "LeBlanc",
    "link": "https://www.metatft.com/units/LeBlanc",
    ability: {
      AbilityDescription: "Chain together the nearest <span classname=\"UnitAbilityDescVar ChainTargets\">4/4/20</span> enemies for <span classname=\"UnitAbilityDescVar ChainDuration\">5</span> seconds, dealing <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">650/975/5000</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage split between them. When one takes damage, <tftbonus><span classname=\"UnitAbilityDescVar DamageShare\">18/25/100</span>%</tftbonus> of the amount is split as bonus true damage to the&nbsp;others.<br><br>LeBlanc's next <span classname=\"UnitAbilityDescVar NumAttacks\">3</span> attacks deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedAutoDamage\">160/240/900</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> bonus magic damage, increased by <tftbonus><span classname=\"UnitAbilityDescVar AutoKillBonus\">50</span>%</tftbonus> for each enemy killed by the initial damage.",
      icon: "https://cdn.metatft.com/file/metatft/champions/leblance.png",
      name: "The Chains of Fate"
    }
  },
  {
    name: "Rumble",
    "link": "https://www.metatft.com/units/Rumble",
    ability: {
      AbilityDescription: "Call down a rain of <span classname=\"UnitAbilityDescVar NumMissile\">5</span> missiles on target's row that each deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">500/750/4000</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage, <tftkeyword>Wound</tftkeyword>, and 1% <tftkeyword>Burn</tftkeyword> units hit for <span classname=\"UnitAbilityDescVar WoundDuration\">5</span> seconds. For each missile that doesn't hit an enemy, restore <span classname=\"UnitAbilityDescVar ManaPerMissile\">20</span>&nbsp;Mana.<br><br>If there's only 1 enemy left, fire all of the missiles at&nbsp;them.<br><br><rules>Burn: Deal a percent of the target's max Health as true damage every second<br>Wound: Reduce healing received by 33%</rules><br><br>",
      icon: "https://cdn.metatft.com/file/metatft/champions/rumble_r.png",
      name: "The Equalizer"
    }
  },
  {
    name: "Caitlyn",
    "link": "https://www.metatft.com/units/Caitlyn",
    ability: {
      AbilityDescription: "Enter a sniper's stance and call in an airship that circles the battlefield for <span classname=\"UnitAbilityDescVar RaidDuration\">5</span> seconds, dropping <span classname=\"UnitAbilityDescVar TotalShots\">4/4/20</span> bombs at a random cluster of enemies over the duration. Bombs deal <physicaldamage><span classname=\"UnitAbilityDescVar TotalDamage\">168/251/1484</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">&nbsp;<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</physicaldamage> physical damage in a one-hex&nbsp;circle.<br><br>Whenever an enemy is caught in the epicenter of an Air Raid blast, reduce their Armor and Magic Resist by <span classname=\"UnitAbilityDescVar ResistReduction\">20</span> and fire a shot towards them, dealing <physicaldamage><span classname=\"UnitAbilityDescVar HeadshotDamage\">230/344/2491</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical&nbsp;damage.",
      icon: "https://cdn.metatft.com/file/metatft/champions/caitlyn_headshot.png",
      name: "Air Raid"
    }
  },
  {
    name: "Violet",
    "link": "https://www.metatft.com/units/Red",
    ability: {
      AbilityDescription: "Jab target <span classname=\"UnitAbilityDescVar NumStrikes\">2</span> times for <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">68/101/152</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage each. Then uppercut them, dealing <physicaldamage><span classname=\"UnitAbilityDescVar TotalDamage\">185/278/416</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\"><img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</physicaldamage> physical damage and briefly knocking them&nbsp;up.",
      icon: "https://cdn.metatft.com/file/metatft/champions/tft13_red_ability.png",
      name: "1-2-3 Combo"
    }
  },
  {
    name: "Malzahar",
    "link": "https://www.metatft.com/units/Malzahar",
    ability: {
      AbilityDescription: "Summon a gate in a 5-hex line across target. Enemies hit take <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">80/120/1000</span> (<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage and are 20% <tftkeyword>Shredded</tftkeyword> for <span classname=\"UnitAbilityDescVar ShredDuration\">4</span> seconds. Malzahar spreads 5 stacks of infection between enemies hit.<br><br>Infection deals <magicdamage><span classname=\"UnitAbilityDescVar ModifiedInfectionDamage\">14/21/400</span> (<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage per second for the rest of combat. This effect can stack infinitely. When an infected target dies, they spread their stacks to nearby enemies.<br><br><rules><tftbold>Shred:</tftbold> Reduce Magic Resist</rules>",
      icon: "https://cdn.metatft.com/file/metatft/champions/tft13_malzaharspellicon.png",
      name: "Call of the Machine"
    }
  },
  {
    name: "Jinx",
    "link": "https://www.metatft.com/units/Jinx",
    ability: {
      AbilityDescription: "<tftrules>Jinx alternates between Zap, Flame Chompers, and Death Rocket for her&nbsp;ability.</tftrules><br><br><spellactive>Zap:</spellactive> Deal <physicaldamage><span classname=\"UnitAbilityDescVar ZapModifiedDamage\">159/239/2700</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to enemies in a line and Stun them for <scalelevel><span classname=\"UnitAbilityDescVar ZapStunDuration\">1.25/1.5/10</span></scalelevel>&nbsp;seconds.<br><spellactive>Flame Chompers:</spellactive> Deal <physicaldamage><span classname=\"UnitAbilityDescVar FlameChompersModifiedDamage\">159/239/2700</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to <span classname=\"UnitAbilityDescVar NumOfFlameChompers\">3</span> 1-hex circles of&nbsp;enemies.<br><spellactive>Death Rocket:</spellactive> Fire a rocket at the center of the board that <physicaldamage><span classname=\"UnitAbilityDescVar DeathRocketModifiedDamage\">480/720/12451</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\"><img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</physicaldamage> physical damage to ALL enemies, reduced by <span classname=\"UnitAbilityDescVar FalloffPercent\">10</span>% for each hex they are away from the epicenter.",
      icon: "https://cdn.metatft.com/file/metatft/champions/jinx_p.png",
      name: "Ruin Everything"
    }
  },
  {
    name: "Vander",
    "link": "https://www.metatft.com/units/Prime",
    ability: {
      AbilityDescription: "Stop attacking and brace for <span classname=\"UnitAbilityDescVar TauntDuration\">2.5</span> seconds, gaining <tftbonus><span classname=\"UnitAbilityDescVar ModifiedDefenses\">100/125/150</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</tftbonus> Armor and Magic Resist. Vander's next attack is replaced with a strike that deals <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">200/300/450</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage, increased by <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedBonusDamage\">50/75/113</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage for each 1 or 2 cost champion on your&nbsp;team.",
      icon: "https://cdn.metatft.com/file/metatft/champions/primespell.png",
      name: "Hound of the Underground"
    }
  },
  {
    name: "Powder",
    "link": "https://www.metatft.com/units/Blue",
    ability: {
      AbilityDescription: "Send a monkey towards the largest group of enemies, causing a 2-hex radius explosion on impact. Enemies hit take <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">350/500/700</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage, reduced by <span classname=\"UnitAbilityDescVar FalloffPercent\">30/30/25</span>% for each hex they are away from the epicenter. <tftkeyword>Wound</tftkeyword> and 1% <tftkeyword>Burn</tftkeyword> applied for <span classname=\"UnitAbilityDescVar IgniteDuration\">5</span>&nbsp;seconds to all enemies hit.<br><br><rules>Burn: Deal a percent of the target's max Health as true damage every second<br>Wound: Reduce healing received by 33%<br></rules>",
      icon: "https://cdn.metatft.com/file/metatft/champions/blue_spell.png",
      name: "Misfit Toy"
    }
  },
  {
    name: "Vi",
    "link": "https://www.metatft.com/units/Vi",
    ability: {
      AbilityDescription: "Gain <tftbonus><span classname=\"UnitAbilityDescVar ModifiedShield\">280/325/1200</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</tftbonus> Shield for <span classname=\"UnitAbilityDescVar ShieldDuration\">3</span> seconds, then Stun target for <span classname=\"UnitAbilityDescVar StunDuration\">1.5</span> seconds. Slam them down, dealing <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">450/675/2025</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to them and causing a shockwave in their row. Enemies hit take <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedSecondaryDamage\">135/203/844</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage and are briefly knocked&nbsp;up.",
      icon: "https://cdn.metatft.com/file/metatft/champions/vir.png",
      name: "Wrecking Crew"
    }
  },
  {
    name: "Draven",
    "link": "https://www.metatft.com/units/Draven",
    ability: {
      AbilityDescription: "<spellpassive>Passive:</spellpassive> If Draven has an empowered axe in hand, his next attack will throw it, dealing a total of <physicaldamage><span classname=\"UnitAbilityDescVar TotalDamage\">87/131/198</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage. Empowered axes return to Draven after hitting an&nbsp;enemy.<br><br><spellactive>Active:</spellactive> Spin an empowered&nbsp;axe.",
      icon: "https://cdn.metatft.com/file/metatft/champions/draven_spinningaxe.png",
      name: "Spinning Axes"
    }
  },
  {
    name: "Urgot",
    "link": "https://www.metatft.com/units/Urgot",
    ability: {
      AbilityDescription: "Fire an explosive charge, dealing <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedPrimaryDamage\">185/275/446</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to target and <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedSecondaryDamage\">110/163/261</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to adjacent enemies. 20% <tftkeyword>Sunder</tftkeyword> all enemies hit for <span classname=\"UnitAbilityDescVar Duration\">6</span>&nbsp;seconds.<br><br><rules><tftbold>Sunder:</tftbold> Reduce Armor</rules><br><br><spellactive enabled=\"TFT13_ExperimentActive\" alternate=\"rules\">Experiment Bonus:<tftbonus><showif.tft13_experimentactive></showif.tft13_experimentactive></tftbonus> Dash to targets. On cast, gain <tftbonus enabled=\"TFT13_ExperimentActive\" alternate=\"rules\">8%</tftbonus> max Health Shield and <tftbonus enabled=\"TFT13_ExperimentActive\" alternate=\"rules\">20%</tftbonus>&nbsp;Attack Speed for <span classname=\"UnitAbilityDescVar ExperimentDuration\">5</span>&nbsp;seconds.</spellactive>",
      icon: "https://cdn.metatft.com/file/metatft/champions/tft13_urgot_q.png",
      name: "Corrosive Charge"
    }
  },
  {
    name: "Gangplank",
    "link": "https://www.metatft.com/units/Gangplank",
    ability: {
      AbilityDescription: "Restore <scalehealth><span classname=\"UnitAbilityDescVar ModifiedHeal\">100/125/150</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</scalehealth> Health. Then slash, dealing <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">170/255/383</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to enemies in a line. If only one enemy is hit, the damage is&nbsp;doubled.",
      icon: "https://cdn.metatft.com/file/metatft/champions/tft13_gangplank_passive.png",
      name: "Harvest from Flames"
    }
  },
  {
    name: "Darius",
    "link": "https://www.metatft.com/units/Darius",
    ability: {
      AbilityDescription: "Spin, dealing <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">132/198/297</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to adjacent enemies and healing <scalehealth><span classname=\"UnitAbilityDescVar ModifiedHeal\">150/175/200</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</scalehealth>. Apply a <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedBleedDamage\">110/165/248</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage bleed to target over <span classname=\"UnitAbilityDescVar BleedDuration\">4</span>&nbsp;seconds.",
      icon: "https://cdn.metatft.com/file/metatft/champions/darius_icon_decimate.png",
      name: "Decimate"
    }
  },
  {
    name: "Silco",
    "link": "https://www.metatft.com/units/Silco",
    ability: {
      AbilityDescription: "Throw a canister at target, dealing <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">100/200/1000</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to them and releasing <scalelevel><span classname=\"UnitAbilityDescVar MinionsSpawned\">4/4/8</span></scalelevel> monstrosities. Monstrosities attack <span classname=\"UnitAbilityDescVar MinionNumAttacks\">5</span> times and deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedMinionDamage\">38/57/100</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage per&nbsp;attack.",
      icon: "https://cdn.metatft.com/file/metatft/champions/tft6_silco_eyeofthestorm.png",
      name: "Canned Monstrosity"
    }
  },
  {
    name: "Sion",
    "link": "https://www.metatft.com/units/Sion",
    ability: {
      AbilityDescription: "<spellpassive>Freed:</spellpassive> Charge through the nearest enemy, dealing <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedChargeDamage\">50/75/113</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to all enemies&nbsp;hit. <br><br><spellactive>Active:</spellactive> Gain <tftbonus><span classname=\"UnitAbilityDescVar ModifiedShield\">175</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</tftbonus> Shield for <span classname=\"UnitAbilityDescVar ShieldDuration\">5</span> seconds. Stun enemies in a line on target for <span classname=\"UnitAbilityDescVar StunDuration\">1.5</span> seconds and deal <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">150/225/338</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to&nbsp;them.",
      icon: "https://cdn.metatft.com/file/metatft/champions/sionspell_1.png",
      name: "Decimating Smash"
    }
  },
  {
    name: "Ekko",
    "link": "https://www.metatft.com/units/Ekko",
    ability: {
      AbilityDescription: "Summon an assault of afterimages that deals <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">290/435/1200</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to the target and <magicdamage><span classname=\"UnitAbilityDescVar ModifiedSecondaryDamage\">145/215/450</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to <scalelevel><span classname=\"UnitAbilityDescVar NumBonusEnemies\">2/2/4</span></scalelevel> other nearby&nbsp;enemies. Afterimages reduce their target's Magic Resist by <span classname=\"UnitAbilityDescVar ShredAmount\">5</span> for the rest of combat.",
      icon: "https://cdn.metatft.com/file/metatft/champions/ekkospell.png",
      name: "Splitting Seconds"
    }
  },
  {
    name: "Illaoi",
    "link": "https://www.metatft.com/units/Illaoi",
    ability: {
      AbilityDescription: "Gain <tftbonus><span classname=\"UnitAbilityDescVar DR\">50/50/90</span>%</tftbonus> Durability for <span classname=\"UnitAbilityDescVar SpellDuration\">3</span> seconds. Over the duration, drain <truedamage><span classname=\"UnitAbilityDescVar ModifiedHealthSteal\">50/75/225</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</truedamage> Health from the nearest <scalelevel><span classname=\"UnitAbilityDescVar NumEnemies\">4/4/10</span></scalelevel> enemies. Then slam down, dealing <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">72/108/840</span>&nbsp;(<img src=\"/icons/Armor.png\" alt=\"Armor\" class=\"statIcon scaleArmorIcon\"><img src=\"/icons/MR.png\" alt=\"MR\" class=\"statIcon scaleMRIcon\">)</magicdamage> magic damage to all enemies within 2&nbsp;hexes.",
      icon: "https://cdn.metatft.com/file/metatft/champions/illaoi_e_debuff.png",
      name: "Test of Spirit"
    }
  },
  {
    name: "Twisted Fate",
    "link": "https://www.metatft.com/units/TwistedFate",
    ability: {
      AbilityDescription: "Throw 3 cards at different targets.<br><br><spellactive>Blue Card:</spellactive> Restore <scalehealth><span classname=\"UnitAbilityDescVar ModifiedHeal\">90/110/140</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</scalehealth> Health to the lowest Health ally.<br><spellactive>Red Card:</spellactive> Deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedRedDamage\">110/165/255</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to the largest circle of&nbsp;enemies.<br><spellactive>Yellow Card:</spellactive> Deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedYellowDamage\">230/345/535</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to target and Stun them for <span classname=\"UnitAbilityDescVar StunDuration\">1</span>&nbsp;second.",
      icon: "https://cdn.metatft.com/file/metatft/champions/cardmaster_powercard.png",
      name: "Wild Cards"
    }
  },
  {
    name: "Nocturne",
    "link": "https://www.metatft.com/units/Nocturne",
    ability: {
      AbilityDescription: "For <span classname=\"UnitAbilityDescVar Duration\">6</span> seconds, attacks also cause adjacent enemies to bleed for <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">93/142/245</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage over <span classname=\"UnitAbilityDescVar BleedDuration\">1</span>&nbsp;second.",
      icon: "https://cdn.metatft.com/file/metatft/champions/tft13_nocturne_eyeofthestorm.png",
      name: "Overdrive Blades"
    }
  },
  {
    name: "Elise",
    "link": "https://www.metatft.com/units/Elise",
    ability: {
      AbilityDescription: "Jump to a nearby hex and web all enemies within <span classname=\"UnitAbilityDescVar HexRadius\">2</span> hexes, Stunning them for <span classname=\"UnitAbilityDescVar StunDuration\">1.75/2/8</span> seconds and dealing <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">120/180/1200</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage. Heal <scalehealth><span classname=\"UnitAbilityDescVar ModifiedHeal\">400/450/2000</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</scalehealth>.",
      icon: "https://cdn.metatft.com/file/metatft/champions/elise_melee.png",
      name: "Cocoon"
    }
  },
  {
    name: "Dr. Mundo",
    "link": "https://www.metatft.com/units/DrMundo",
    ability: {
      AbilityDescription: "Become energized and heal <scalehealth><span classname=\"UnitAbilityDescVar ModifiedHeal\">848/1106/3142</span>&nbsp;(<img src=\"/icons/Health.png\" alt=\"Health\" class=\"statIcon scaleHealthIcon\"><img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</scalehealth> over <span classname=\"UnitAbilityDescVar Duration\">2</span> seconds. While energized, deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">120/180/1000</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to a nearby enemy each second. Afterwards, deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedSecondaryDamage\">77/139/1247</span>&nbsp;(<img src=\"/icons/Health.png\" alt=\"Health\" class=\"statIcon scaleHealthIcon\">)</magicdamage> magic damage to all enemies within 2&nbsp;hexes.<br><br><spellactive enabled=\"TFT13_ExperimentActive\" alternate=\"rules\">Experiment Bonus: <tftbonus><showif.tft13_experimentactive></showif.tft13_experimentactive></tftbonus>Gain <scalehealth enabled=\"TFT13_ExperimentActive\" alternate=\"rules\">120</scalehealth> max Health. On each takedown, gain <scalehealth enabled=\"TFT13_ExperimentActive\" alternate=\"rules\">60</scalehealth> more max&nbsp;Health.</spellactive>",
      icon: "https://cdn.metatft.com/file/metatft/champions/drmundo_e.png",
      name: "Maximum Dosage"
    }
  },
  {
    name: "Ambessa",
    "link": "https://www.metatft.com/units/Ambessa",
    ability: {
      AbilityDescription: "Ambessa switches between two stances on cast:<br><br><spellpassive>Chains:</spellpassive> Gain +1 Range. Attacks deal <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedChainDamage\">98/146/512</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical&nbsp;damage.<br>On cast, dash to target and strike in a half-circle, dealing <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedStrikeDamage\">163/244/731</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to enemies&nbsp;hit.<br><br><spellpassive>Fists:</spellpassive> Gain <tftbonus><span classname=\"UnitAbilityDescVar ModifiedOmnivamp\">25%/25%/45%</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</tftbonus> Omnivamp and attack twice as&nbsp;fast.<br>On cast, briefly Stun target before slamming them into the ground, dealing <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedSlamDamage\">325/488/1755</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage, then dash&nbsp;away.<br>",
      icon: "https://cdn.metatft.com/file/metatft/champions/ambessa_spell.png",
      name: "Unrelenting Huntress"
    }
  },
  {
    name: "Ezreal",
    "link": "https://www.metatft.com/units/Ezreal",
    ability: {
      AbilityDescription: "Fire a shot towards current target that deals <physicaldamage><span classname=\"UnitAbilityDescVar TotalDamage\">101/152/232</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to all enemies within 1 hex. Then, deal <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">101/152/232</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to the unit in the center of the&nbsp;blast.<br><br>",
      icon: "https://cdn.metatft.com/file/metatft/champions/ezreal_spell.png",
      name: "Essence Flux"
    }
  },
  {
    name: "Akali",
    "link": "https://www.metatft.com/units/Akali",
    ability: {
      AbilityDescription: "Throw a shuriken at target, dealing <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">80/120/185</span>&nbsp;(<img src=\"/images/championStatImages/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage and marking them to take <tftbonus><span classname=\"UnitAbilityDescVar TargetDamageAmp\">15</span>%</tftbonus> more damage for <span classname=\"UnitAbilityDescVar Duration\">4</span> seconds. Then dash away from target. After a brief delay, dash towards them and deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedSecondaryDamage\">240/360/550</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic&nbsp;damage.",
      icon: "https://cdn.metatft.com/file/metatft/champions/akali_spell.png",
      name: "Shuriken Flip"
    }
  },
  {
    name: "Zoe",
    "link": "https://www.metatft.com/units/Zoe",
    ability: {
      AbilityDescription: "Launch a star at target that deals <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">140/210/450</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage. It bounces to the farthest enemy within <span classname=\"UnitAbilityDescVar HexLimiter\">4</span> hexes, then bounces back to the target. This effect repeats <span classname=\"UnitAbilityDescVar NumRepeats\">2/2/4</span> times, hitting a different enemy each&nbsp;time.",
      icon: "https://cdn.metatft.com/file/metatft/champions/tft13_zoe_q2.png",
      name: "Paddle Star!"
    }
  },
  {
    name: "Irelia",
    "link": "https://www.metatft.com/units/Irelia",
    ability: {
      AbilityDescription: "Enter a defensive stance and gain <tftbonus><span classname=\"UnitAbilityDescVar ModifiedShield\">400/475/575</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</tftbonus> Shield that rapidly decays over <span classname=\"UnitAbilityDescVar ShieldDuration\">3</span> seconds. When it expires, deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedBaseStrikeDamage\">70/100/150</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage + <magicdamage><span classname=\"UnitAbilityDescVar PercentShieldDamage\">30</span>%</magicdamage> of the damage absorbed to enemies around and in front of&nbsp;Irelia.",
      icon: "https://cdn.metatft.com/file/metatft/champions/ireliaspell.png",
      name: "Defiant Dance"
    }
  },
  {
    name: "Blitzcrank",
    "link": "https://www.metatft.com/units/Blitzcrank",
    ability: {
      AbilityDescription: "<spellpassive>Passive:</spellpassive> After surviving damage, deal <magicdamage><span classname=\"UnitAbilityDescVar PassiveDamagePercent\">3</span>%</magicdamage> of the damage absorbed as magic damage to&nbsp;target.<br><br><spellactive>Active:</spellactive> Gain <tftbonus><span classname=\"UnitAbilityDescVar ModifiedShield\">470/500/550</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</tftbonus> Shield for <span classname=\"UnitAbilityDescVar ShieldDuration\">4</span> seconds. Shock the nearest <span classname=\"UnitAbilityDescVar NumEnemies\">3</span> enemies for <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">40/60/100</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage and reduce their damage by <span classname=\"UnitAbilityDescVar DamageReduction\">10</span>% for <span classname=\"UnitAbilityDescVar ShieldDuration\">4</span>&nbsp;seconds.",
      icon: "https://cdn.metatft.com/file/metatft/champions/blitzcrankq.png",
      name: "Static Field"
    }
  },
  {
    name: "Amumu",
    "link": "https://www.metatft.com/units/Amumu",
    ability: {
      AbilityDescription: "<spellpassive>Passive:</spellpassive> Reduce all incoming damage by <scalelevel><span classname=\"UnitAbilityDescVar FlatDamageReduction\">12/15/25</span></scalelevel>. Every second, emit sparks that deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">10/15/25</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to adjacent&nbsp;enemies.",
      icon: "https://cdn.metatft.com/file/metatft/champions/amumu_w.png",
      name: "Obsolete Technology"
    }
  },
  {
    name: "Cassiopeia",
    "link": "https://www.metatft.com/units/Cassiopeia",
    ability: {
      AbilityDescription: "Blast target for <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">230/345/550</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage. Every third cast, splash miasma to <span classname=\"UnitAbilityDescVar BonusNumEnemies\">2</span> enemies within <span classname=\"UnitAbilityDescVar HexRadius\">3</span> hexes, dealing <magicdamage><span classname=\"UnitAbilityDescVar ModifiedMiasmaDamage\">160/240/385</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to&nbsp;each.",
      icon: "https://cdn.metatft.com/file/metatft/champions/cassiopeia_w.png",
      name: "Thorned Miasma"
    }
  },
  {
    name: "Corki",
    "link": "https://www.metatft.com/units/Corki",
    ability: {
      AbilityDescription: "Lock onto target and strafe to a nearby position, unleashing <scalelevel><span classname=\"UnitAbilityDescVar BaseMissiles\">21/21/35</span></scalelevel> missiles split between the target and all enemies within two hexes. Each missile deals <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">29/43/124</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage and reduces Armor by&nbsp;<span classname=\"UnitAbilityDescVar FlatArmorShred\">1</span>.<br><br>Every <span classname=\"UnitAbilityDescVar SpecialMissileNum\">7</span>th missile deals <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedSpecialDamage\">29/43/124</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage and reduces Armor by&nbsp;<span classname=\"UnitAbilityDescVar SpecialMissileArmorReduction\">1</span>.",
      icon: "https://cdn.metatft.com/file/metatft/champions/corki_rapidreload.png",
      name: "Broadside Barrage"
    }
  },
  {
    name: "Sett",
    "link": "https://www.metatft.com/units/Sett",
    ability: {
      AbilityDescription: "Pull in an enemy on either side and slam them together, dealing <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">180/270/420</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage and Stunning them for <scalelevel><span classname=\"UnitAbilityDescVar StunDuration\">1.5/1.5/2</span></scalelevel>&nbsp;seconds.<br><br>If only one enemy is grabbed, the damage and Stun duration are increased by <tftbonus>50%.</tftbonus>",
      icon: "https://cdn.metatft.com/file/metatft/champions/sett_spell.png",
      name: "Facebreaker"
    }
  },
  {
    name: "Kog'Maw",
    "link": "https://www.metatft.com/units/KogMaw",
    ability: {
      AbilityDescription: "<spellpassive>Passive:</spellpassive> Attacks deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">48/72/120</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> bonus magic&nbsp;damage.<br><br><spellactive>Active:</spellactive> Gain <tftbonus><span classname=\"UnitAbilityDescVar AttackSpeed\">25</span>%</tftbonus> stacking Attack Speed for the rest of combat. After every <span classname=\"UnitAbilityDescVar RangeIncreaseNumAttacks\">3</span> casts, gain&nbsp;+1&nbsp;Range.",
      icon: "https://cdn.metatft.com/file/metatft/champions/tft13_kogmaw_bioarcanebarrage.png",
      name: "Upgrading Barrage Module"
    }
  },
  {
    name: "Leona",
    "link": "https://www.metatft.com/units/Leona",
    ability: {
      AbilityDescription: "Fortify for <span classname=\"UnitAbilityDescVar Duration\">3</span> seconds, gaining <tftbonus><span classname=\"UnitAbilityDescVar ModifiedDurability\">50%</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</tftbonus> Durability. Afterwards, deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">115/175/270</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to adjacent enemies.",
      icon: "https://cdn.metatft.com/file/metatft/champions/tft13_leonasolarbarrier.png",
      name: "Eclipse"
    }
  },
  {
    name: "Vladimir",
    "link": "https://www.metatft.com/units/Vladimir",
    ability: {
      AbilityDescription: "Heal <scalehealth><span classname=\"UnitAbilityDescVar ModifiedHeal\">200/240/300</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</scalehealth> and deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">140/210/325</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to the&nbsp;target.",
      icon: "https://cdn.metatft.com/file/metatft/champions/vladimirq.png",
      name: "Transfusion"
    }
  },
  {
    name: "Twitch",
    "link": "https://www.metatft.com/units/Twitch",
    ability: {
      AbilityDescription: "For the next <span classname=\"UnitAbilityDescVar TotalAttacks\">8</span> attacks, gain <tftbonus><span classname=\"UnitAbilityDescVar AttackSpeed\">85</span>%</tftbonus> Attack Speed, infinite range, and replace attacks with a piercing bolt that targets random enemies. Bolts deal <physicaldamage><span classname=\"UnitAbilityDescVar TotalDamage\">116/172/593</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage, reduced by <span classname=\"UnitAbilityDescVar DamageReduction\">40/40/20</span>% for each enemy they pass&nbsp;through.<br><br><spellactive enabled=\"TFT13_ExperimentActive\" alternate=\"rules\">Experiment Bonus: <tftbonus><showif.tft13_experimentactive></showif.tft13_experimentactive></tftbonus>After every <tftbonus enabled=\"TFT13_ExperimentActive\" alternate=\"rules\"><span classname=\"UnitAbilityDescVar ExperimentDamageTicks\">5</span></tftbonus> attacks, deal physical damage to the nearest enemy equal to <physicaldamage enabled=\"TFT13_ExperimentActive\" alternate=\"rules\">15%</physicaldamage> of their max&nbsp;Health.</spellactive>",
      icon: "https://cdn.metatft.com/file/metatft/champions/twitch_r.png",
      name: "Spray and Pray"
    }
  },
  {
    name: "Steb",
    "link": "https://www.metatft.com/units/Fish",
    ability: {
      AbilityDescription: "<spellpassive>Passive:</spellpassive> On heal, heal the <span classname=\"UnitAbilityDescVar NumAlliesToShare\">2</span> closest allies for <tftbonus><span classname=\"UnitAbilityDescVar PercentAlliedHealShare\">25</span>%</tftbonus> of the&nbsp;amount.<br><br><spellactive>Active:</spellactive> Heal for <scalehealth><span classname=\"UnitAbilityDescVar ModifiedHeal\">270/310/360</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</scalehealth> and strike target for <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">260/390/585</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic&nbsp;damage.",
      icon: "https://cdn.metatft.com/file/metatft/champions/fish_spell.png",
      name: "Field Medicine"
    }
  },
  {
    name: "Heimerdinger",
    "link": "https://www.metatft.com/units/Heimerdinger",
    ability: {
      AbilityDescription: "Fire <scalelevel><span classname=\"UnitAbilityDescVar StartingRockets\">5/5/7</span></scalelevel> missiles at random enemies that deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">50/75/225</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage. Each cast fires <span classname=\"UnitAbilityDescVar MissileIncreasePerCast\">1</span> more missile than the&nbsp;last.",
      icon: "https://cdn.metatft.com/file/metatft/champions/heimerdinger_spell.png",
      name: "PROGRESSSSS!"
    }
  },
  {
    name: "Tristana",
    "link": "https://www.metatft.com/units/Tristana",
    ability: {
      AbilityDescription: "Fire a cannonball at target, dealing <physicaldamage><span classname=\"UnitAbilityDescVar TotalDamage\">271/406/611</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage. If they die, the cannonball ricochets to the nearest enemy, dealing the overkill damage. When it does, permanently gain <tftbonus>1%</tftbonus>&nbsp;Attack Damage.<br><br><tfttrackerlabel>(Current Bonus:&nbsp;% <img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">) </tfttrackerlabel>",
      icon: "https://cdn.metatft.com/file/metatft/champions/tft13_tristana_passive.png",
      name: "Draw a Bead"
    }
  },
  {
    name: "Garen",
    "link": "https://www.metatft.com/units/Garen",
    ability: {
      AbilityDescription: "<spellpassive>Passive:</spellpassive> After dealing damage, heal <scalehealth><span classname=\"UnitAbilityDescVar ModifiedHeal\">15/27/162</span>&nbsp;(<img src=\"/icons/Health.png\" alt=\"Health\" class=\"statIcon scaleHealthIcon\">).</scalehealth><br><br><spellactive>Active:</spellactive> Gain <tftbonus><span classname=\"UnitAbilityDescVar ModifiedShield\">350/490/1986</span>&nbsp;(<img src=\"/icons/Health.png\" alt=\"Health\" class=\"statIcon scaleHealthIcon\"><img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</tftbonus> Shield for <span classname=\"UnitAbilityDescVar ShieldDuration\">4</span> seconds. Slam a massive sword on target, dealing <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">163/244/2194</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to them and <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedSecondaryDamage\">81/122/1097</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to enemies within 2&nbsp;hexes.",
      icon: "https://cdn.metatft.com/file/metatft/champions/tft13_garen_spellicon.png",
      name: "Demacian Justice"
    }
  },
  {
    name: "Nami",
    "link": "https://www.metatft.com/units/Nami",
    ability: {
      AbilityDescription: "Launch a wave at target that bounces <span classname=\"UnitAbilityDescVar NumBounces\">3</span> times to enemies within <span classname=\"UnitAbilityDescVar SearchRange\">3</span> hexes and deals <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">120/180/290</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic&nbsp;damage.",
      icon: "https://cdn.metatft.com/file/metatft/champions/namiw.png",
      name: "Ocean's Ebb"
    }
  },
  {
    name: "Ziggs",
    "link": "https://www.metatft.com/units/Ziggs",
    ability: {
      AbilityDescription: "Toss a bomb at target, dealing <magicdamage><span classname=\"UnitAbilityDescVar ModifiedInitialDamage\">180/270/450</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage. <span classname=\"UnitAbilityDescVar NumBombs\">3</span> mini-bombs fly out, dealing <magicdamage><span classname=\"UnitAbilityDescVar ModifiedSecondaryDamage\">90/135/200</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to random&nbsp;enemies.",
      icon: "https://cdn.metatft.com/file/metatft/champions/ziggsspell.png",
      name: "Bomb Full of Bombs"
    }
  },
  {
    name: "Loris",
    "link": "https://www.metatft.com/units/Beardy",
    ability: {
      AbilityDescription: "Gain <tftbonus><span classname=\"UnitAbilityDescVar ModifiedShield\">525/600/700</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</tftbonus> Shield for <span classname=\"UnitAbilityDescVar Duration\">4</span> seconds. It redirects <tftbonus><span classname=\"UnitAbilityDescVar PercentDamageRedirect\">50</span>%</tftbonus> of damage taken by adjacent allies. When it expires, deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">150/225/360</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage in a&nbsp;cone.",
      icon: "https://cdn.metatft.com/file/metatft/champions/beardy_spell.png",
      name: "Piltover Bulwark"
    }
  },
  {
    name: "Lux",
    "link": "https://www.metatft.com/units/Lux",
    ability: {
      AbilityDescription: "Grant <tftbonus><span classname=\"UnitAbilityDescVar ModifiedShield\">160/180/240</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</tftbonus> Shield to the lowest current Health ally. Lux's next attack deals <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">360/540/900</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> bonus magic&nbsp;damage.",
      icon: "https://cdn.metatft.com/file/metatft/champions/tft13_luxprismawrap.png",
      name: "Prismatic Barrier"
    }
  },
  {
    name: "Rell",
    "link": "https://www.metatft.com/units/Rell",
    ability: {
      AbilityDescription: "Gain <tftbonus><span classname=\"UnitAbilityDescVar ModifiedShield\">300/350/400</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</tftbonus> Shield for <span classname=\"UnitAbilityDescVar ShieldDuration\">4</span> seconds. Lance enemies in a line for <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">120/180/270</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage and steal <tftbonus><span classname=\"UnitAbilityDescVar DefensesSteal\">10/12/15</span></tftbonus> Armor and Magic Resist from enemies&nbsp;hit.",
      icon: "https://cdn.metatft.com/file/metatft/champions/rellspell.png",
      name: "Shattering Strike"
    }
  },
  {
    name: "Zyra",
    "link": "https://www.metatft.com/units/Zyra",
    ability: {
      AbilityDescription: "Send vines towards the current target, Stunning them for <span classname=\"UnitAbilityDescVar StunDuration\">1</span> second and dealing <magicdamage><span classname=\"UnitAbilityDescVar ModifiedTargetDamage\">260/390/585</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic&nbsp;damage. Then smaller vines seek out the <span classname=\"UnitAbilityDescVar NumSmallerVines\">2</span> nearest enemies and deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedAOEDamage\">95/140/215</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to them.<br><br><spellactive enabled=\"TFT13_ExperimentActive\" alternate=\"rules\">Experiment Bonus:<tftbonus><showif.tft13_experimentactive></showif.tft13_experimentactive></tftbonus> Ability damage bleeds enemies for <truedamage enabled=\"TFT13_ExperimentActive\" alternate=\"rules\">50%</truedamage> bonus true damage over <span classname=\"UnitAbilityDescVar ExperimentDuration\">2</span>&nbsp;seconds.</spellactive>",
      icon: "https://cdn.metatft.com/file/metatft/champions/tft13_zyraspellicon.png",
      name: "Grasping Roots"
    }
  },
  {
    name: "Morgana",
    "link": "https://www.metatft.com/units/Morgana",
    ability: {
      AbilityDescription: "Curse the nearest non-cursed enemy, dealing <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">525/780/1300</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage over <span classname=\"UnitAbilityDescVar Duration\">10</span> seconds and reducing the effectiveness of shields used on them by&nbsp;<span classname=\"UnitAbilityDescVar ShieldReavePercent\">50</span>%.",
      icon: "https://cdn.metatft.com/file/metatft/champions/fallenangel_empathize.png",
      name: "Tormented Soul"
    }
  },
  {
    name: "Renni",
    "link": "https://www.metatft.com/units/Chainsaw",
    ability: {
      AbilityDescription: "Heal <scalehealth><span classname=\"UnitAbilityDescVar ModifiedHealing\">428/555/788</span>&nbsp;(<img src=\"/icons/Health.png\" alt=\"Health\" class=\"statIcon scaleHealthIcon\"><img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</scalehealth> over <span classname=\"UnitAbilityDescVar StunDuration\">1.5</span> seconds. For the duration, raise target into the air, Stunning them, and dealing <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">275/413/619</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage. Afterwards, slam them down, dealing <physicaldamage><span classname=\"UnitAbilityDescVar FinalDamage\">110/165/248</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to all adjacent&nbsp;enemies.<br><br>",
      icon: "https://cdn.metatft.com/file/metatft/champions/chainsawspell.png",
      name: "Sludgerunner's Smash"
    }
  },
  {
    name: "Nunu & Willump",
    "link": "https://www.metatft.com/units/NunuWillump",
    ability: {
      AbilityDescription: "For <span classname=\"UnitAbilityDescVar DamageDuration\">3</span> seconds, gain <tftbonus><span classname=\"UnitAbilityDescVar ModifiedDurability\">50%/50%/55%</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</tftbonus> Durability and create a 2-hex cloud of noxious fumes that deals <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">30/45/65</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to enemies within. Afterwards, detonate the cloud and deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedSecondDamage\">150/225/340</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to all enemies&nbsp;within.<br><br><spellactive enabled=\"TFT13_ExperimentActive\" alternate=\"rules\">Experiment Bonus: <tftbonus><showif.tft13_experimentactive></showif.tft13_experimentactive></tftbonus>After dealing damage, deal <magicdamage enabled=\"TFT13_ExperimentActive\" alternate=\"rules\">3%&nbsp;</magicdamage>max&nbsp;<img src=\"/icons/Health.png\" alt=\"Health\" class=\"statIcon scaleHealthIcon\"> bonus magic&nbsp;damage (<span classname=\"UnitAbilityDescVar ExperimentICD\">1</span>s&nbsp;cooldown).</spellactive>",
      icon: "https://cdn.metatft.com/file/metatft/champions/nunuspell.png",
      name: "ZOMBIE POWER!!"
    }
  },
  {
    name: "Swain",
    "link": "https://www.metatft.com/units/Swain",
    ability: {
      AbilityDescription: "Heal <scalehealth><span classname=\"UnitAbilityDescVar ModifiedHeal\">240/300/380</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</scalehealth> and ascend for <span classname=\"UnitAbilityDescVar Duration\">6</span> seconds. While ascended, heal <scalehealth><span classname=\"UnitAbilityDescVar ModifiedHealPerSecond\">70/90/125</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</scalehealth> and deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">40/60/95</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to adjacent enemies every second. On takedown, the ascension's duration is extended by <span classname=\"UnitAbilityDescVar BonusDuration\">2</span>&nbsp;seconds.",
      icon: "https://cdn.metatft.com/file/metatft/champions/swain_melee.png",
      name: "Demonic Ascension"
    }
  },
  {
    name: "Renata Glasc",
    "link": "https://www.metatft.com/units/RenataGlasc",
    ability: {
      AbilityDescription: "Fire a pair of missiles at target. Allies they pass through gain <tftbonus><span classname=\"UnitAbilityDescVar ModifiedShield\">95/120/150</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</tftbonus> Shield for <span classname=\"UnitAbilityDescVar ShieldDuration\">3</span> seconds. When they collide, they deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedTargetDamage\">310/465/700</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to target and <magicdamage><span classname=\"UnitAbilityDescVar ModifiedExplosionDamage\">155/230/350</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to adjacent&nbsp;enemies.",
      icon: "https://cdn.metatft.com/file/metatft/champions/renata_e.png",
      name: "Loyalty Program"
    }
  },
  {
    name: "Camille",
    "link": "https://www.metatft.com/units/Camille",
    ability: {
      AbilityDescription: "Kick the target, dealing <truedamage><span classname=\"UnitAbilityDescVar TotalDamage\">145/217/363</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\"><img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</truedamage> <tftkeyword>Adaptive Damage</tftkeyword>. Heal for <span classname=\"UnitAbilityDescVar HealPercent\">33</span>% of the damage&nbsp;dealt.<br><br><rules><tftbold>Adaptive Damage:</tftbold> Uses the damage type the target resists less</rules><br>",
      icon: "https://cdn.metatft.com/file/metatft/champions/camille_spell.png",
      name: "Adaptive Strike"
    }
  },
  {
    name: "Scar",
    "link": "https://www.metatft.com/units/FlyGuy",
    ability: {
      AbilityDescription: "Lob bombs at the nearest <span classname=\"UnitAbilityDescVar NumEnemies\">3</span> enemies, Stunning them for <scalelevel><span classname=\"UnitAbilityDescVar StunDuration\">1.5/1.5/1.75</span></scalelevel> seconds and dealing <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">80/120/180</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to each. Heal <scalehealth><span classname=\"UnitAbilityDescVar ModifiedHeal\">220/240/270</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</scalehealth>.",
      icon: "https://cdn.metatft.com/file/metatft/champions/flyguy_spell.png",
      name: "Sumpsnipe Surprise"
    }
  },
  {
    name: "Vex",
    "link": "https://www.metatft.com/units/Vex",
    ability: {
      AbilityDescription: "Deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">220/330/550</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to target and create a one-hex radius zone of darkness around them. After a brief delay, deal <magicdamage><span classname=\"UnitAbilityDescVar ModifiedSecondaryDamage\">110/165/275</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</magicdamage> magic damage to enemies still in the&nbsp;zone.",
      icon: "https://cdn.metatft.com/file/metatft/champions/icons_tft13_vex_spell.png",
      name: "Looming Darkness"
    }
  },
  {
    name: "Singed",
    "link": "https://www.metatft.com/units/Singed",
    ability: {
      AbilityDescription: "Gain <tftbonus><span classname=\"UnitAbilityDescVar ModifiedDurability\">50%/50%/60%</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</tftbonus>&nbsp;Durability and grant the ally who has dealt the most damage this round <scalelevel><span classname=\"UnitAbilityDescVar AttackSpeed\">100/120/160</span>%</scalelevel> Attack Speed, decaying over <span classname=\"UnitAbilityDescVar Duration\">4</span>&nbsp;seconds.",
      icon: "https://cdn.metatft.com/file/metatft/champions/singed_r.png",
      name: "Dangerous Mutations"
    }
  },
  {
    name: "Trundle",
    "link": "https://www.metatft.com/units/Trundle",
    ability: {
      AbilityDescription: "Heal <scalehealth><span classname=\"UnitAbilityDescVar ModifiedHeal\">200/220/250</span>&nbsp;(<img src=\"/icons/AP.png\" alt=\"AP\" class=\"statIcon scaleAPIcon\">)</scalehealth> and chomp target for <physicaldamage><span classname=\"UnitAbilityDescVar ModifiedDamage\">140/210/315</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage. Both effects are increased by up to <span classname=\"UnitAbilityDescVar AmountIncreaseMax\">75</span>% based on Trundle's missing&nbsp;Health.",
      icon: "https://cdn.metatft.com/file/metatft/champions/trundle_q.png",
      name: "Desperate Chomp"
    }
  },
  {
    name: "Maddie",
    "link": "https://www.metatft.com/units/Shooter",
    ability: {
      AbilityDescription: "Fire <span classname=\"UnitAbilityDescVar NumOfShots\">6</span> shots towards the farthest enemy that deal <physicaldamage><span classname=\"UnitAbilityDescVar TotalDamage\">73/109/183</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to the first enemy they&nbsp;hit.",
      icon: "https://cdn.metatft.com/file/metatft/champions/shooterspellicon.png",
      name: "Fan the Hammer"
    }
  },
  {
    name: "Zeri",
    "link": "https://www.metatft.com/units/Zeri",
    ability: {
      AbilityDescription: "<spellpassive>Passive:</spellpassive> Every <span classname=\"UnitAbilityDescVar NumOfAttacks\">3</span>rd attack is replaced with a spark that deals <physicaldamage><span classname=\"UnitAbilityDescVar TotalDamage\">100/150/223</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to target and <physicaldamage><span classname=\"UnitAbilityDescVar SecondaryDamage\">100/150/223</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage to <span classname=\"UnitAbilityDescVar NumOfBounces\">2</span> nearby enemies.",
      icon: "https://cdn.metatft.com/file/metatft/champions/zeri_p.png",
      name: "Living Battery"
    }
  },
  {
    name: "Smeech",
    "link": "https://www.metatft.com/units/Gremlin",
    ability: {
      AbilityDescription: "Leap towards the enemy with the fewest items within <span classname=\"UnitAbilityDescVar LeapHexRange\">4</span> hexes. Slash <span classname=\"UnitAbilityDescVar BaseNumStabs\">3</span> times, dealing a total of <physicaldamage><span classname=\"UnitAbilityDescVar TotalDamage\">420/630/958</span>&nbsp;(<img src=\"/icons/AD.png\" alt=\"AD\" class=\"statIcon scaleADIcon\">)</physicaldamage> physical damage. If they die, leap again, dealing <span classname=\"UnitAbilityDescVar DamageReductionOnLeap\">30</span>% less&nbsp;damage.",
      icon: "https://cdn.metatft.com/file/metatft/champions/gremlinspell.png",
      name: "Scrap Hacker"
    }
  }




]

const championBISItems = [ {
  champion: "Akali",
  top5Builds: [
    {
      items: [
        "Automata Emblem",
        "Jeweled Gauntlet",
        "Hand Of Justice"
      ],
      "avgPlace": "3.87",
      "placeChange": "3.87",
      "playRate": "N/A"
    },
    {
      items: [
        "Automata Emblem",
        "Bloodthirster",
        "Jeweled Gauntlet"
      ],
      "avgPlace": "3.73",
      "placeChange": "3.73",
      "playRate": "N/A"
    },
    {
      items: [
        "Automata Emblem",
        "Rabadon's Deathcap",
        "Hand Of Justice"
      ],
      "avgPlace": "3.49",
      "placeChange": "3.49",
      "playRate": "N/A"
    },
    {
      items: [
        "Automata Emblem",
        "Titan's Resolve",
        "Hand Of Justice"
      ],
      "avgPlace": "3.64",
      "placeChange": "3.64",
      "playRate": "N/A"
    },
    {
      items: [
        "Automata Emblem",
        "Bloodthirster",
        "Hand Of Justice"
      ],
      "avgPlace": "3.74",
      "placeChange": "3.74",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Ambessa",
  top5Builds: [
    {
      items: [
        "Automata Emblem",
        "Bloodthirster",
        "Edge of Night"
      ],
      "avgPlace": "3.39",
      "placeChange": "3.39",
      "playRate": "N/A"
    },
    {
      items: [
        "Bloodthirster",
        "Edge of Night",
        "Titan's Resolve"
      ],
      "avgPlace": "4.21",
      "placeChange": "4.21",
      "playRate": "N/A"
    },
    {
      items: [
        "Automata Emblem",
        "Bloodthirster",
        "Titan's Resolve"
      ],
      "avgPlace": "3.46",
      "placeChange": "3.46",
      "playRate": "N/A"
    },
    {
      items: [
        "Edge of Night",
        "Titan's Resolve",
        "Hand Of Justice"
      ],
      "avgPlace": "4.18",
      "placeChange": "4.18",
      "playRate": "N/A"
    },
    {
      items: [
        "Suspicious Trench Coat",
        "Edge of Night",
        "Sterak's Gage"
      ],
      "avgPlace": "3.54",
      "placeChange": "3.54",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Amumu",
  top5Builds: [
    {
      items: [
        "Gargoyle Stoneplate",
        "Redemption",
        "Evenshroud"
      ],
      "avgPlace": "2.55",
      "placeChange": "2.55",
      "playRate": "N/A"
    },
    {
      items: [
        "Sunfire Cape",
        "Evenshroud",
        "Warmog's Armor"
      ],
      "avgPlace": "2.88",
      "placeChange": "2.88",
      "playRate": "N/A"
    },
    {
      items: [
        "Gargoyle Stoneplate",
        "Sunfire Cape",
        "Redemption"
      ],
      "avgPlace": "3.42",
      "placeChange": "3.42",
      "playRate": "N/A"
    },
    {
      items: [
        "Sunfire Cape",
        "Redemption",
        "Evenshroud"
      ],
      "avgPlace": "3.11",
      "placeChange": "3.11",
      "playRate": "N/A"
    },
    {
      items: [
        "Dragon's Claw",
        "Steadfast Heart",
        "Sunfire Cape"
      ],
      "avgPlace": "2.27",
      "placeChange": "2.27",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Blitzcrank",
  top5Builds: [
    {
      items: [
        "Sunfire Cape",
        "Redemption",
        "Evenshroud"
      ],
      "avgPlace": "3.54",
      "placeChange": "3.54",
      "playRate": "N/A"
    },
    {
      items: [
        "Gargoyle Stoneplate",
        "Sunfire Cape",
        "Warmog's Armor"
      ],
      "avgPlace": "4.07",
      "placeChange": "4.07",
      "playRate": "N/A"
    },
    {
      items: [
        "Dragon's Claw",
        "Sunfire Cape",
        "Evenshroud"
      ],
      "avgPlace": "2.85",
      "placeChange": "2.85",
      "playRate": "N/A"
    },
    {
      items: [
        "Gargoyle Stoneplate",
        "Sunfire Cape",
        "Evenshroud"
      ],
      "avgPlace": "3.73",
      "placeChange": "3.73",
      "playRate": "N/A"
    },
    {
      items: [
        "Gargoyle Stoneplate",
        "Sunfire Cape",
        "Redemption"
      ],
      "avgPlace": "3.82",
      "placeChange": "3.82",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Caitlyn",
  top5Builds: [
    {
      items: [
        "Deathblade",
        "Infinity Edge",
        "Spear of Shojin"
      ],
      "avgPlace": "3.19",
      "placeChange": "3.19",
      "playRate": "N/A"
    },
    {
      items: [
        "Infinity Edge",
        "Last Whisper",
        "Spear of Shojin"
      ],
      "avgPlace": "3.51",
      "placeChange": "3.51",
      "playRate": "N/A"
    },
    {
      items: [
        "Infinity Edge",
        "Giant Slayer",
        "Spear of Shojin"
      ],
      "avgPlace": "3.46",
      "placeChange": "3.46",
      "playRate": "N/A"
    },
    {
      items: [
        "Infinity Edge",
        "Guardbreaker",
        "Spear of Shojin"
      ],
      "avgPlace": "3.35",
      "placeChange": "3.35",
      "playRate": "N/A"
    },
    {
      items: [
        "Infinity Edge",
        "Last Whisper",
        "Giant Slayer"
      ],
      "avgPlace": "3.22",
      "placeChange": "3.22",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Camille",
  top5Builds: [
    {
      items: [
        "Prowler's Claw",
        "Titan's Resolve",
        "Hand Of Justice"
      ],
      "avgPlace": "3.24",
      "placeChange": "3.24",
      "playRate": "N/A"
    },
    {
      items: [
        "Edge of Night",
        "Infinity Edge",
        "Hand Of Justice"
      ],
      "avgPlace": "3.19",
      "placeChange": "3.19",
      "playRate": "N/A"
    },
    {
      items: [
        "Edge of Night",
        "Titan's Resolve",
        "Hand Of Justice"
      ],
      "avgPlace": "4.63",
      "placeChange": "4.63",
      "playRate": "N/A"
    },
    {
      items: [
        "Spectral Cutlass",
        "Edge of Night",
        "Hand Of Justice"
      ],
      "avgPlace": "3.36",
      "placeChange": "3.36",
      "playRate": "N/A"
    },
    {
      items: [
        "Prowler's Claw",
        "Edge of Night",
        "Hand Of Justice"
      ],
      "avgPlace": "3.38",
      "placeChange": "3.38",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Cassiopeia",
  top5Builds: [
    {
      items: [
        "Jeweled Gauntlet",
        "Nashor's Tooth",
        "Spear of Shojin"
      ],
      "avgPlace": "4.53",
      "placeChange": "4.53",
      "playRate": "N/A"
    },
    {
      items: [
        "Blue Buff",
        "Jeweled Gauntlet",
        "Nashor's Tooth"
      ],
      "avgPlace": "4.28",
      "placeChange": "4.28",
      "playRate": "N/A"
    },
    {
      items: [
        "Red Buff",
        "Spear of Shojin",
        "Statikk Shiv"
      ],
      "avgPlace": "4.08",
      "placeChange": "4.08",
      "playRate": "N/A"
    },
    {
      items: [
        "Nashor's Tooth",
        "Giant Slayer",
        "Spear of Shojin"
      ],
      "avgPlace": "4.03",
      "placeChange": "4.03",
      "playRate": "N/A"
    },
    {
      items: [
        "Jeweled Gauntlet",
        "Guardbreaker",
        "Spear of Shojin"
      ],
      "avgPlace": "3.76",
      "placeChange": "3.76",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Corki",
  top5Builds: [
    {
      items: [
        "Gold Collector",
        "Infinity Edge",
        "Last Whisper"
      ],
      "avgPlace": "3.63",
      "placeChange": "3.63",
      "playRate": "N/A"
    },
    {
      items: [
        "Infinity Edge",
        "Last Whisper",
        "Guardbreaker"
      ],
      "avgPlace": "3.78",
      "placeChange": "3.78",
      "playRate": "N/A"
    },
    {
      items: [
        "Infinity Edge",
        "Last Whisper",
        "Giant Slayer"
      ],
      "avgPlace": "4.02",
      "placeChange": "4.02",
      "playRate": "N/A"
    },
    {
      items: [
        "Deathblade",
        "Infinity Edge",
        "Last Whisper"
      ],
      "avgPlace": "3.95",
      "placeChange": "3.95",
      "playRate": "N/A"
    },
    {
      items: [
        "Infinity Edge",
        "Infinity Edge",
        "Last Whisper"
      ],
      "avgPlace": "3.90",
      "placeChange": "3.90",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Darius",
  top5Builds: [
    {
      items: [
        "Family Emblem",
        "Bloodthirster",
        "Titan's Resolve"
      ],
      "avgPlace": "3.03",
      "placeChange": "3.03",
      "playRate": "N/A"
    },
    {
      items: [
        "Pit Fighter Emblem",
        "Sterak's Gage",
        "Titan's Resolve"
      ],
      "avgPlace": "3.00",
      "placeChange": "3.00",
      "playRate": "N/A"
    },
    {
      items: [
        "Pit Fighter Emblem",
        "Bloodthirster",
        "Sterak's Gage"
      ],
      "avgPlace": "3.66",
      "placeChange": "3.66",
      "playRate": "N/A"
    },
    {
      items: [
        "Family Emblem",
        "Pit Fighter Emblem",
        "Sterak's Gage"
      ],
      "avgPlace": "3.04",
      "placeChange": "3.04",
      "playRate": "N/A"
    },
    {
      items: [
        "Family Emblem",
        "Pit Fighter Emblem",
        "Bloodthirster"
      ],
      "avgPlace": "3.15",
      "placeChange": "3.15",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Draven",
  top5Builds: [
    {
      items: [
        "Family Emblem",
        "Guinsoo's Rageblade",
        "Last Whisper"
      ],
      "avgPlace": "3.59",
      "placeChange": "3.59",
      "playRate": "N/A"
    },
    {
      items: [
        "Guinsoo's Rageblade",
        "Last Whisper",
        "Giant Slayer"
      ],
      "avgPlace": "3.79",
      "placeChange": "3.79",
      "playRate": "N/A"
    },
    {
      items: [
        "Deathblade",
        "Guinsoo's Rageblade",
        "Last Whisper"
      ],
      "avgPlace": "3.75",
      "placeChange": "3.75",
      "playRate": "N/A"
    },
    {
      items: [
        "Family Emblem",
        "Fishbones",
        "Guinsoo's Rageblade"
      ],
      "avgPlace": "2.68",
      "placeChange": "2.68",
      "playRate": "N/A"
    },
    {
      items: [
        "Guinsoo's Rageblade",
        "Guinsoo's Rageblade",
        "Last Whisper"
      ],
      "avgPlace": "3.94",
      "placeChange": "3.94",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Ekko",
  top5Builds: [
    {
      items: [
        "Crownguard",
        "Ionic Spark",
        "Tear of the Goddess"
      ],
      "avgPlace": "3.83",
      "placeChange": "3.83",
      "playRate": "N/A"
    },
    {
      items: [
        "Chain Vest",
        "Ionic Spark",
        "Hand Of Justice"
      ],
      "avgPlace": "3.51",
      "placeChange": "3.51",
      "playRate": "N/A"
    },
    {
      items: [
        "Crownguard",
        "Needlessly Large Rod",
        "Hand Of Justice"
      ],
      "avgPlace": "4.23",
      "placeChange": "4.23",
      "playRate": "N/A"
    },
    {
      items: [
        "Ionic Spark",
        "Needlessly Large Rod",
        "Hand Of Justice"
      ],
      "avgPlace": "4.51",
      "placeChange": "4.51",
      "playRate": "N/A"
    },
    {
      items: [
        "Needlessly Large Rod",
        "Rabadon's Deathcap",
        "Hand Of Justice"
      ],
      "avgPlace": "4.10",
      "placeChange": "4.10",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Elise",
  top5Builds: [
    {
      items: [
        "Dragon's Claw",
        "Gargoyle Stoneplate",
        "Warmog's Armor"
      ],
      "avgPlace": "4.09",
      "placeChange": "4.09",
      "playRate": "N/A"
    },
    {
      items: [
        "Bramble Vest",
        "Dragon's Claw",
        "Warmog's Armor"
      ],
      "avgPlace": "4.16",
      "placeChange": "4.16",
      "playRate": "N/A"
    },
    {
      items: [
        "Dragon's Claw",
        "Sunfire Cape",
        "Redemption"
      ],
      "avgPlace": "3.67",
      "placeChange": "3.67",
      "playRate": "N/A"
    },
    {
      items: [
        "Protector's Vow",
        "Gargoyle Stoneplate",
        "Warmog's Armor"
      ],
      "avgPlace": "3.54",
      "placeChange": "3.54",
      "playRate": "N/A"
    },
    {
      items: [
        "Gargoyle Stoneplate",
        "Redemption",
        "Warmog's Armor"
      ],
      "avgPlace": "4.02",
      "placeChange": "4.02",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Ezreal",
  top5Builds: [
    {
      items: [
        "Guinsoo's Rageblade",
        "Last Whisper",
        "Runaan's Hurricane"
      ],
      "avgPlace": "3.26",
      "placeChange": "3.26",
      "playRate": "N/A"
    },
    {
      items: [
        "Deathblade",
        "Infinity Edge",
        "Last Whisper"
      ],
      "avgPlace": "4.02",
      "placeChange": "4.02",
      "playRate": "N/A"
    },
    {
      items: [
        "Deathblade",
        "Deathblade",
        "Spear of Shojin"
      ],
      "avgPlace": "3.11",
      "placeChange": "3.11",
      "playRate": "N/A"
    },
    {
      items: [
        "Runaan's Hurricane",
        "Runaan's Hurricane",
        "Runaan's Hurricane"
      ],
      "avgPlace": "4.21",
      "placeChange": "4.21",
      "playRate": "N/A"
    },
    {
      items: [
        "Deathblade",
        "Last Whisper",
        "Giant Slayer"
      ],
      "avgPlace": "3.69",
      "placeChange": "3.69",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Gangplank",
  top5Builds: [
    {
      items: [
        "Guinsoo's Rageblade",
        "Infinity Edge",
        "Last Whisper"
      ],
      "avgPlace": "4.40",
      "placeChange": "4.40",
      "playRate": "N/A"
    },
    {
      items: [
        "Infinity Edge",
        "Last Whisper",
        "Spear of Shojin"
      ],
      "avgPlace": "4.40",
      "placeChange": "4.40",
      "playRate": "N/A"
    },
    {
      items: [
        "Conqueror Emblem",
        "Infinity Edge",
        "Last Whisper"
      ],
      "avgPlace": "4.00",
      "placeChange": "4.00",
      "playRate": "N/A"
    },
    {
      items: [
        "Infinity Edge",
        "Giant Slayer",
        "Spear of Shojin"
      ],
      "avgPlace": "4.03",
      "placeChange": "4.03",
      "playRate": "N/A"
    },
    {
      items: [
        "Gold Collector",
        "Guinsoo's Rageblade",
        "Infinity Edge"
      ],
      "avgPlace": "3.99",
      "placeChange": "3.99",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Garen",
  top5Builds: [
    {
      items: [
        "Sunfire Cape",
        "Redemption",
        "Warmog's Armor"
      ],
      "avgPlace": "3.61",
      "placeChange": "3.61",
      "playRate": "N/A"
    },
    {
      items: [
        "Dragon's Claw",
        "Sunfire Cape",
        "Warmog's Armor"
      ],
      "avgPlace": "3.97",
      "placeChange": "3.97",
      "playRate": "N/A"
    },
    {
      items: [
        "Gargoyle Stoneplate",
        "Sunfire Cape",
        "Warmog's Armor"
      ],
      "avgPlace": "4.05",
      "placeChange": "4.05",
      "playRate": "N/A"
    },
    {
      items: [
        "Gargoyle Stoneplate",
        "Redemption",
        "Warmog's Armor"
      ],
      "avgPlace": "4.07",
      "placeChange": "4.07",
      "playRate": "N/A"
    },
    {
      items: [
        "Dragon's Claw",
        "Redemption",
        "Warmog's Armor"
      ],
      "avgPlace": "3.83",
      "placeChange": "3.83",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Heimerdinger",
  top5Builds: [
    {
      items: [
        "Blue Buff",
        "Jeweled Gauntlet",
        "Guardbreaker"
      ],
      "avgPlace": "3.95",
      "placeChange": "3.95",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Blue Buff",
        "Hextech Gunblade"
      ],
      "avgPlace": "4.20",
      "placeChange": "4.20",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Blue Buff",
        "Jeweled Gauntlet"
      ],
      "avgPlace": "4.13",
      "placeChange": "4.13",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Blue Buff",
        "Nashor's Tooth"
      ],
      "avgPlace": "4.12",
      "placeChange": "4.12",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Blue Buff",
        "Guardbreaker"
      ],
      "avgPlace": "3.99",
      "placeChange": "3.99",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Illaoi",
  top5Builds: [
    {
      items: [
        "Gargoyle Stoneplate",
        "Redemption",
        "Warmog's Armor"
      ],
      "avgPlace": "4.05",
      "placeChange": "4.05",
      "playRate": "N/A"
    },
    {
      items: [
        "Dragon's Claw",
        "Sunfire Cape",
        "Warmog's Armor"
      ],
      "avgPlace": "4.06",
      "placeChange": "4.06",
      "playRate": "N/A"
    },
    {
      items: [
        "Dragon's Claw",
        "Gargoyle Stoneplate",
        "Warmog's Armor"
      ],
      "avgPlace": "4.16",
      "placeChange": "4.16",
      "playRate": "N/A"
    },
    {
      items: [
        "Bramble Vest",
        "Dragon's Claw",
        "Warmog's Armor"
      ],
      "avgPlace": "4.15",
      "placeChange": "4.15",
      "playRate": "N/A"
    },
    {
      items: [
        "Bramble Vest",
        "Dragon's Claw",
        "Redemption"
      ],
      "avgPlace": "3.77",
      "placeChange": "3.77",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Irelia",
  top5Builds: [
    {
      items: [
        "Ionic Spark",
        "Sunfire Cape",
        "Redemption"
      ],
      "avgPlace": "3.54",
      "placeChange": "3.54",
      "playRate": "N/A"
    },
    {
      items: [
        "Ionic Spark",
        "Redemption",
        "Warmog's Armor"
      ],
      "avgPlace": "3.45",
      "placeChange": "3.45",
      "playRate": "N/A"
    },
    {
      items: [
        "Gargoyle Stoneplate",
        "Redemption",
        "Warmog's Armor"
      ],
      "avgPlace": "4.14",
      "placeChange": "4.14",
      "playRate": "N/A"
    },
    {
      items: [
        "Gargoyle Stoneplate",
        "Ionic Spark",
        "Steadfast Heart"
      ],
      "avgPlace": "4.11",
      "placeChange": "4.11",
      "playRate": "N/A"
    },
    {
      items: [
        "Sunfire Cape",
        "Redemption",
        "Warmog's Armor"
      ],
      "avgPlace": "3.63",
      "placeChange": "3.63",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Jayce",
  top5Builds: [
    {
      items: [
        "Infinity Edge",
        "Giant Slayer",
        "Spear of Shojin"
      ],
      "avgPlace": "3.32",
      "placeChange": "3.32",
      "playRate": "N/A"
    },
    {
      items: [
        "Deathblade",
        "Infinity Edge",
        "Spear of Shojin"
      ],
      "avgPlace": "3.23",
      "placeChange": "3.23",
      "playRate": "N/A"
    },
    {
      items: [
        "Infinity Edge",
        "Last Whisper",
        "Spear of Shojin"
      ],
      "avgPlace": "3.67",
      "placeChange": "3.67",
      "playRate": "N/A"
    },
    {
      items: [
        "Infinity Edge",
        "Last Whisper",
        "Giant Slayer"
      ],
      "avgPlace": "3.55",
      "placeChange": "3.55",
      "playRate": "N/A"
    },
    {
      items: [
        "Conqueror Emblem",
        "Infinity Edge",
        "Last Whisper"
      ],
      "avgPlace": "2.80",
      "placeChange": "2.80",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Jinx",
  top5Builds: [
    {
      items: [
        "Infinity Edge",
        "Guardbreaker",
        "Spear of Shojin"
      ],
      "avgPlace": "3.09",
      "placeChange": "3.09",
      "playRate": "N/A"
    },
    {
      items: [
        "Infinity Edge",
        "Giant Slayer",
        "Spear of Shojin"
      ],
      "avgPlace": "3.31",
      "placeChange": "3.31",
      "playRate": "N/A"
    },
    {
      items: [
        "Deathblade",
        "Infinity Edge",
        "Spear of Shojin"
      ],
      "avgPlace": "3.33",
      "placeChange": "3.33",
      "playRate": "N/A"
    },
    {
      items: [
        "Infinity Edge",
        "Last Whisper",
        "Spear of Shojin"
      ],
      "avgPlace": "3.67",
      "placeChange": "3.67",
      "playRate": "N/A"
    },
    {
      items: [
        "Infinity Edge",
        "Infinity Edge",
        "Spear of Shojin"
      ],
      "avgPlace": "3.49",
      "placeChange": "3.49",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "LeBlanc",
  top5Builds: [
    {
      items: [
        "Red Buff",
        "Spear of Shojin",
        "Statikk Shiv"
      ],
      "avgPlace": "3.10",
      "placeChange": "3.10",
      "playRate": "N/A"
    },
    {
      items: [
        "Nashor's Tooth",
        "Red Buff",
        "Spear of Shojin"
      ],
      "avgPlace": "3.18",
      "placeChange": "3.18",
      "playRate": "N/A"
    },
    {
      items: [
        "Giant Slayer",
        "Red Buff",
        "Spear of Shojin"
      ],
      "avgPlace": "3.18",
      "placeChange": "3.18",
      "playRate": "N/A"
    },
    {
      items: [
        "Jeweled Gauntlet",
        "Red Buff",
        "Spear of Shojin"
      ],
      "avgPlace": "3.87",
      "placeChange": "3.87",
      "playRate": "N/A"
    },
    {
      items: [
        "Nashor's Tooth",
        "Morellonomicon",
        "Spear of Shojin"
      ],
      "avgPlace": "3.27",
      "placeChange": "3.27",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Leona",
  top5Builds: [
    {
      items: [
        "Sunfire Cape",
        "Redemption",
        "Warmog's Armor"
      ],
      "avgPlace": "3.42",
      "placeChange": "3.42",
      "playRate": "N/A"
    },
    {
      items: [
        "Gargoyle Stoneplate",
        "Sunfire Cape",
        "Redemption"
      ],
      "avgPlace": "4.02",
      "placeChange": "4.02",
      "playRate": "N/A"
    },
    {
      items: [
        "Ionic Spark",
        "Sunfire Cape",
        "Redemption"
      ],
      "avgPlace": "3.93",
      "placeChange": "3.93",
      "playRate": "N/A"
    },
    {
      items: [
        "Dragon's Claw",
        "Sunfire Cape",
        "Redemption"
      ],
      "avgPlace": "3.95",
      "placeChange": "3.95",
      "playRate": "N/A"
    },
    {
      items: [
        "Crownguard",
        "Sunfire Cape",
        "Redemption"
      ],
      "avgPlace": "3.41",
      "placeChange": "3.41",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Lux",
  top5Builds: [
    {
      items: [
        "Archangel's Staff",
        "Archangel's Staff",
        "Bloodthirster"
      ],
      "avgPlace": "4.50",
      "placeChange": "4.50",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Archangel's Staff",
        "Hextech Gunblade"
      ],
      "avgPlace": "3.59",
      "placeChange": "3.59",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Guinsoo's Rageblade",
        "Statikk Shiv"
      ],
      "avgPlace": "2.82",
      "placeChange": "2.82",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Nashor's Tooth",
        "Spear of Shojin"
      ],
      "avgPlace": "4.55",
      "placeChange": "4.55",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Hextech Gunblade",
        "Nashor's Tooth"
      ],
      "avgPlace": "3.36",
      "placeChange": "3.36",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Malzahar",
  top5Builds: [
    {
      items: [
        "Archangel's Staff",
        "Morellonomicon",
        "Spear of Shojin"
      ],
      "avgPlace": "3.25",
      "placeChange": "3.25",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Red Buff",
        "Spear of Shojin"
      ],
      "avgPlace": "3.58",
      "placeChange": "3.58",
      "playRate": "N/A"
    },
    {
      items: [
        "Morellonomicon",
        "Spear of Shojin",
        "Statikk Shiv"
      ],
      "avgPlace": "3.17",
      "placeChange": "3.17",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Nashor's Tooth",
        "Spear of Shojin"
      ],
      "avgPlace": "3.75",
      "placeChange": "3.75",
      "playRate": "N/A"
    },
    {
      items: [
        "Guardbreaker",
        "Red Buff",
        "Spear of Shojin"
      ],
      "avgPlace": "3.02",
      "placeChange": "3.02",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Mordekaiser",
  top5Builds: [
    {
      items: [
        "Jeweled Gauntlet",
        "Quicksilver",
        "Hand Of Justice"
      ],
      "avgPlace": "3.39",
      "placeChange": "3.39",
      "playRate": "N/A"
    },
    {
      items: [
        "Edge of Night",
        "Nashor's Tooth",
        "Quicksilver"
      ],
      "avgPlace": "3.33",
      "placeChange": "3.33",
      "playRate": "N/A"
    },
    {
      items: [
        "Bloodthirster",
        "Jeweled Gauntlet",
        "Quicksilver"
      ],
      "avgPlace": "3.39",
      "placeChange": "3.39",
      "playRate": "N/A"
    },
    {
      items: [
        "Bloodthirster",
        "Nashor's Tooth",
        "Quicksilver"
      ],
      "avgPlace": "3.47",
      "placeChange": "3.47",
      "playRate": "N/A"
    },
    {
      items: [
        "Jeweled Gauntlet",
        "Nashor's Tooth",
        "Quicksilver"
      ],
      "avgPlace": "3.47",
      "placeChange": "3.47",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Morgana",
  top5Builds: [
    {
      items: [
        "Morellonomicon",
        "Spear of Shojin",
        "Statikk Shiv"
      ],
      "avgPlace": "3.71",
      "placeChange": "3.71",
      "playRate": "N/A"
    },
    {
      items: [
        "Hextech Gunblade",
        "Red Buff",
        "Statikk Shiv"
      ],
      "avgPlace": "3.33",
      "placeChange": "3.33",
      "playRate": "N/A"
    },
    {
      items: [
        "Red Buff",
        "Spear of Shojin",
        "Statikk Shiv"
      ],
      "avgPlace": "3.91",
      "placeChange": "3.91",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Blue Buff",
        "Red Buff"
      ],
      "avgPlace": "2.93",
      "placeChange": "2.93",
      "playRate": "N/A"
    },
    {
      items: [
        "Hextech Gunblade",
        "Morellonomicon",
        "Spear of Shojin"
      ],
      "avgPlace": "2.40",
      "placeChange": "2.40",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Nami",
  top5Builds: [
    {
      items: [
        "Jeweled Gauntlet",
        "Nashor's Tooth",
        "Spear of Shojin"
      ],
      "avgPlace": "4.56",
      "placeChange": "4.56",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Jeweled Gauntlet",
        "Spear of Shojin"
      ],
      "avgPlace": "4.48",
      "placeChange": "4.48",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Nashor's Tooth",
        "Spear of Shojin"
      ],
      "avgPlace": "4.44",
      "placeChange": "4.44",
      "playRate": "N/A"
    },
    {
      items: [
        "Nashor's Tooth",
        "Spear of Shojin",
        "Statikk Shiv"
      ],
      "avgPlace": "3.58",
      "placeChange": "3.58",
      "playRate": "N/A"
    },
    {
      items: [
        "Red Buff",
        "Spear of Shojin",
        "Statikk Shiv"
      ],
      "avgPlace": "3.73",
      "placeChange": "3.73",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Nocturne",
  top5Builds: [
    {
      items: [
        "Rapid Firecannon",
        "Infinity Edge",
        "Hand Of Justice"
      ],
      "avgPlace": "3.42",
      "placeChange": "3.42",
      "playRate": "N/A"
    },
    {
      items: [
        "Fishbones",
        "Infinity Edge",
        "Hand Of Justice"
      ],
      "avgPlace": "3.42",
      "placeChange": "3.42",
      "playRate": "N/A"
    },
    {
      items: [
        "Sniper's Focus",
        "Fishbones",
        "Rapid Firecannon"
      ],
      "avgPlace": "1.85",
      "placeChange": "1.85",
      "playRate": "N/A"
    },
    {
      items: [
        "Fishbones",
        "Rapid Firecannon",
        "Infinity Edge"
      ],
      "avgPlace": "2.61",
      "placeChange": "2.61",
      "playRate": "N/A"
    },
    {
      items: [
        "Sniper's Focus",
        "Fishbones",
        "Infinity Edge"
      ],
      "avgPlace": "2.36",
      "placeChange": "2.36",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Rell",
  top5Builds: [
    {
      items: [
        "Ionic Spark",
        "Sunfire Cape",
        "Redemption"
      ],
      "avgPlace": "3.64",
      "placeChange": "3.64",
      "playRate": "N/A"
    },
    {
      items: [
        "Ionic Spark",
        "Steadfast Heart",
        "Sunfire Cape"
      ],
      "avgPlace": "3.75",
      "placeChange": "3.75",
      "playRate": "N/A"
    },
    {
      items: [
        "Sunfire Cape",
        "Redemption",
        "Warmog's Armor"
      ],
      "avgPlace": "3.54",
      "placeChange": "3.54",
      "playRate": "N/A"
    },
    {
      items: [
        "Dragon's Claw",
        "Gargoyle Stoneplate",
        "Redemption"
      ],
      "avgPlace": "3.82",
      "placeChange": "3.82",
      "playRate": "N/A"
    },
    {
      items: [
        "Gargoyle Stoneplate",
        "Sunfire Cape",
        "Redemption"
      ],
      "avgPlace": "4.04",
      "placeChange": "4.04",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Rumble",
  top5Builds: [
    {
      items: [
        "Ionic Spark",
        "Jeweled Gauntlet",
        "Hand Of Justice"
      ],
      "avgPlace": "3.18",
      "placeChange": "3.18",
      "playRate": "N/A"
    },
    {
      items: [
        "Bloodthirster",
        "Ionic Spark",
        "Jeweled Gauntlet"
      ],
      "avgPlace": "3.05",
      "placeChange": "3.05",
      "playRate": "N/A"
    },
    {
      items: [
        "Bloodthirster",
        "Jeweled Gauntlet",
        "Rabadon's Deathcap"
      ],
      "avgPlace": "2.61",
      "placeChange": "2.61",
      "playRate": "N/A"
    },
    {
      items: [
        "Bloodthirster",
        "Crownguard",
        "Jeweled Gauntlet"
      ],
      "avgPlace": "3.27",
      "placeChange": "3.27",
      "playRate": "N/A"
    },
    {
      items: [
        "Crownguard",
        "Jeweled Gauntlet",
        "Hand Of Justice"
      ],
      "avgPlace": "3.36",
      "placeChange": "3.36",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Sett",
  top5Builds: [
    {
      items: [
        "Deathblade",
        "Warmog's Armor",
        "Warmog's Armor"
      ],
      "avgPlace": "3.39",
      "placeChange": "3.39",
      "playRate": "N/A"
    },
    {
      items: [
        "Ionic Spark",
        "Sunfire Cape",
        "Warmog's Armor"
      ],
      "avgPlace": "3.83",
      "placeChange": "3.83",
      "playRate": "N/A"
    },
    {
      items: [
        "Dragon's Claw",
        "Redemption",
        "Warmog's Armor"
      ],
      "avgPlace": "3.38",
      "placeChange": "3.38",
      "playRate": "N/A"
    },
    {
      items: [
        "Warmog's Armor",
        "Warmog's Armor",
        "Warmog's Armor"
      ],
      "avgPlace": "3.76",
      "placeChange": "3.76",
      "playRate": "N/A"
    },
    {
      items: [
        "Sunfire Cape",
        "Evenshroud"
      ],
      "avgPlace": "3.27",
      "placeChange": "3.27",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Silco",
  top5Builds: [
    {
      items: [
        "Perfected Virulent Virus",
        "Nashor's Tooth",
        "Spear of Shojin"
      ],
      "avgPlace": "1.33",
      "placeChange": "1.33",
      "playRate": "N/A"
    },
    {
      items: [
        "Perfected Virulent Virus",
        "Jeweled Gauntlet",
        "Spear of Shojin"
      ],
      "avgPlace": "1.52",
      "placeChange": "1.52",
      "playRate": "N/A"
    },
    {
      items: [
        "Perfected Unleashed Toxins",
        "Nashor's Tooth",
        "Spear of Shojin"
      ],
      "avgPlace": "1.77",
      "placeChange": "1.77",
      "playRate": "N/A"
    },
    {
      items: [
        "Perfected Voltaic Saber",
        "Nashor's Tooth",
        "Spear of Shojin"
      ],
      "avgPlace": "1.56",
      "placeChange": "1.56",
      "playRate": "N/A"
    },
    {
      items: [
        "Nashor's Tooth",
        "Spear of Shojin",
        "Spear of Shojin"
      ],
      "avgPlace": "4.03",
      "placeChange": "4.03",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Singed",
  top5Builds: [
    {
      items: [
        "Crownguard",
        "Gargoyle Stoneplate",
        "Warmog's Armor"
      ],
      "avgPlace": "4.00",
      "placeChange": "4.00",
      "playRate": "N/A"
    },
    {
      items: [
        "Gargoyle Stoneplate",
        "Redemption",
        "Warmog's Armor"
      ],
      "avgPlace": "3.94",
      "placeChange": "3.94",
      "playRate": "N/A"
    },
    {
      items: [
        "Dragon's Claw",
        "Gargoyle Stoneplate",
        "Warmog's Armor"
      ],
      "avgPlace": "4.22",
      "placeChange": "4.22",
      "playRate": "N/A"
    },
    {
      items: [
        "Bramble Vest",
        "Dragon's Claw",
        "Warmog's Armor"
      ],
      "avgPlace": "3.81",
      "placeChange": "3.81",
      "playRate": "N/A"
    },
    {
      items: [
        "Bramble Vest",
        "Gargoyle Stoneplate",
        "Warmog's Armor"
      ],
      "avgPlace": "3.71",
      "placeChange": "3.71",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Swain",
  top5Builds: [
    {
      items: [
        "Gargoyle Stoneplate",
        "Sunfire Cape",
        "Redemption"
      ],
      "avgPlace": "4.15",
      "placeChange": "4.15",
      "playRate": "N/A"
    },
    {
      items: [
        "Jeweled Gauntlet",
        "Guardbreaker",
        "Spear of Shojin"
      ],
      "avgPlace": "3.99",
      "placeChange": "3.99",
      "playRate": "N/A"
    },
    {
      items: [
        "Bramble Vest",
        "Dragon's Claw",
        "Warmog's Armor"
      ],
      "avgPlace": "4.26",
      "placeChange": "4.26",
      "playRate": "N/A"
    },
    {
      items: [
        "Gargoyle Stoneplate",
        "Redemption",
        "Warmog's Armor"
      ],
      "avgPlace": "4.41",
      "placeChange": "4.41",
      "playRate": "N/A"
    },
    {
      items: [
        "Crownguard",
        "Gargoyle Stoneplate",
        "Redemption"
      ],
      "avgPlace": "3.89",
      "placeChange": "3.89",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Tristana",
  top5Builds: [
    {
      items: [
        "Gold Collector",
        "Guinsoo's Rageblade",
        "Infinity Edge"
      ],
      "avgPlace": "4.09",
      "placeChange": "4.09",
      "playRate": "N/A"
    },
    {
      items: [
        "Guinsoo's Rageblade",
        "Hextech Gunblade",
        "Infinity Edge"
      ],
      "avgPlace": "4.02",
      "placeChange": "4.02",
      "playRate": "N/A"
    },
    {
      items: [
        "Guinsoo's Rageblade",
        "Infinity Edge",
        "Giant Slayer"
      ],
      "avgPlace": "4.16",
      "placeChange": "4.16",
      "playRate": "N/A"
    },
    {
      items: [
        "Deathblade",
        "Guinsoo's Rageblade",
        "Infinity Edge"
      ],
      "avgPlace": "4.36",
      "placeChange": "4.36",
      "playRate": "N/A"
    },
    {
      items: [
        "Guinsoo's Rageblade",
        "Infinity Edge",
        "Last Whisper"
      ],
      "avgPlace": "4.55",
      "placeChange": "4.55",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Trundle",
  top5Builds: [
    {
      items: [
        "Bloodthirster",
        "Edge of Night",
        "Titan's Resolve"
      ],
      "avgPlace": "4.13",
      "placeChange": "4.13",
      "playRate": "N/A"
    },
    {
      items: [
        "Bloodthirster",
        "Sterak's Gage",
        "Titan's Resolve"
      ],
      "avgPlace": "4.65",
      "placeChange": "4.65",
      "playRate": "N/A"
    },
    {
      items: [
        "Giant's Belt",
        "Sunfire Cape",
        "Evenshroud"
      ],
      "avgPlace": "3.25",
      "placeChange": "3.25",
      "playRate": "N/A"
    },
    {
      items: [
        "Bloodthirster",
        "Quicksilver",
        "Titan's Resolve"
      ],
      "avgPlace": "4.62",
      "placeChange": "4.62",
      "playRate": "N/A"
    },
    {
      items: [
        "Chain Vest",
        "Sunfire Cape"
      ],
      "avgPlace": "4.34",
      "placeChange": "4.34",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Twitch",
  top5Builds: [
    {
      items: [
        "Gold Collector",
        "Guinsoo's Rageblade",
        "Infinity Edge"
      ],
      "avgPlace": "3.93",
      "placeChange": "3.93",
      "playRate": "N/A"
    },
    {
      items: [
        "Guinsoo's Rageblade",
        "Infinity Edge",
        "Red Buff"
      ],
      "avgPlace": "4.28",
      "placeChange": "4.28",
      "playRate": "N/A"
    },
    {
      items: [
        "Guinsoo's Rageblade",
        "Infinity Edge",
        "Last Whisper"
      ],
      "avgPlace": "4.32",
      "placeChange": "4.32",
      "playRate": "N/A"
    },
    {
      items: [
        "Guinsoo's Rageblade",
        "Guinsoo's Rageblade",
        "Infinity Edge"
      ],
      "avgPlace": "4.36",
      "placeChange": "4.36",
      "playRate": "N/A"
    },
    {
      items: [
        "Guinsoo's Rageblade",
        "Infinity Edge",
        "Quicksilver"
      ],
      "avgPlace": "3.73",
      "placeChange": "3.73",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Urgot",
  top5Builds: [
    {
      items: [
        "Sterak's Gage",
        "Sterak's Gage",
        "Sterak's Gage"
      ],
      "avgPlace": "3.91",
      "placeChange": "3.91",
      "playRate": "N/A"
    },
    {
      items: [
        "Bloodthirster",
        "Sterak's Gage",
        "Titan's Resolve"
      ],
      "avgPlace": "4.39",
      "placeChange": "4.39",
      "playRate": "N/A"
    },
    {
      items: [
        "Infinity Edge",
        "Quicksilver",
        "Hand Of Justice"
      ],
      "avgPlace": "4.60",
      "placeChange": "4.60",
      "playRate": "N/A"
    },
    {
      items: [
        "Bloodthirster",
        "Infinity Edge",
        "Quicksilver"
      ],
      "avgPlace": "3.86",
      "placeChange": "3.86",
      "playRate": "N/A"
    },
    {
      items: [
        "Sentinel Emblem",
        "Bloodthirster",
        "Titan's Resolve"
      ],
      "avgPlace": "3.35",
      "placeChange": "3.35",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Vex",
  top5Builds: [
    {
      items: [
        "Archangel's Staff",
        "Jeweled Gauntlet",
        "Spear of Shojin"
      ],
      "avgPlace": "4.01",
      "placeChange": "4.01",
      "playRate": "N/A"
    },
    {
      items: [
        "Jeweled Gauntlet",
        "Nashor's Tooth",
        "Spear of Shojin"
      ],
      "avgPlace": "4.47",
      "placeChange": "4.47",
      "playRate": "N/A"
    },
    {
      items: [
        "Jeweled Gauntlet",
        "Spear of Shojin",
        "Statikk Shiv"
      ],
      "avgPlace": "3.89",
      "placeChange": "3.89",
      "playRate": "N/A"
    },
    {
      items: [
        "Jeweled Gauntlet",
        "Giant Slayer",
        "Spear of Shojin"
      ],
      "avgPlace": "4.12",
      "placeChange": "4.12",
      "playRate": "N/A"
    },
    {
      items: [
        "Morellonomicon",
        "Spear of Shojin",
        "Statikk Shiv"
      ],
      "avgPlace": "3.72",
      "placeChange": "3.72",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Vi",
  top5Builds: [
    {
      items: [
        "Bloodthirster",
        "Sterak's Gage",
        "Titan's Resolve"
      ],
      "avgPlace": "4.21",
      "placeChange": "4.21",
      "playRate": "N/A"
    },
    {
      items: [
        "Family Emblem",
        "Bloodthirster",
        "Sterak's Gage"
      ],
      "avgPlace": "2.87",
      "placeChange": "2.87",
      "playRate": "N/A"
    },
    {
      items: [
        "Bloodthirster",
        "Edge of Night",
        "Titan's Resolve"
      ],
      "avgPlace": "4.19",
      "placeChange": "4.19",
      "playRate": "N/A"
    },
    {
      items: [
        "Sterak's Gage",
        "Titan's Resolve",
        "Hand Of Justice"
      ],
      "avgPlace": "4.23",
      "placeChange": "4.23",
      "playRate": "N/A"
    },
    {
      items: [
        "Family Emblem",
        "Bloodthirster",
        "Titan's Resolve"
      ],
      "avgPlace": "3.29",
      "placeChange": "3.29",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Vladimir",
  top5Builds: [
    {
      items: [
        "Archangel's Staff",
        "Nashor's Tooth",
        "Spear of Shojin"
      ],
      "avgPlace": "4.25",
      "placeChange": "4.25",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Guinsoo's Rageblade",
        "Hextech Gunblade"
      ],
      "avgPlace": "4.71",
      "placeChange": "4.71",
      "playRate": "N/A"
    },
    {
      items: [
        "Gargoyle Stoneplate",
        "Gargoyle Stoneplate",
        "Ionic Spark"
      ],
      "avgPlace": "3.62",
      "placeChange": "3.62",
      "playRate": "N/A"
    },
    {
      items: [
        "Jeweled Gauntlet",
        "Nashor's Tooth",
        "Spear of Shojin"
      ],
      "avgPlace": "4.32",
      "placeChange": "4.32",
      "playRate": "N/A"
    },
    {
      items: [
        "Dragon's Claw",
        "Gargoyle Stoneplate",
        "Warmog's Armor"
      ],
      "avgPlace": "4.17",
      "placeChange": "4.17",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Zeri",
  top5Builds: [
    {
      items: [
        "Guinsoo's Rageblade",
        "Infinity Edge",
        "Last Whisper"
      ],
      "avgPlace": "4.32",
      "placeChange": "4.32",
      "playRate": "N/A"
    },
    {
      items: [
        "Guinsoo's Rageblade",
        "Guinsoo's Rageblade",
        "Infinity Edge"
      ],
      "avgPlace": "4.26",
      "placeChange": "4.26",
      "playRate": "N/A"
    },
    {
      items: [
        "Guinsoo's Rageblade",
        "Infinity Edge",
        "Red Buff"
      ],
      "avgPlace": "4.31",
      "placeChange": "4.31",
      "playRate": "N/A"
    },
    {
      items: [
        "Infinity Edge",
        "Last Whisper",
        "Red Buff"
      ],
      "avgPlace": "3.72",
      "placeChange": "3.72",
      "playRate": "N/A"
    },
    {
      items: [
        "Guinsoo's Rageblade",
        "Infinity Edge",
        "Giant Slayer"
      ],
      "avgPlace": "4.59",
      "placeChange": "4.59",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Ziggs",
  top5Builds: [
    {
      items: [
        "Jeweled Gauntlet",
        "Nashor's Tooth",
        "Spear of Shojin"
      ],
      "avgPlace": "4.35",
      "placeChange": "4.35",
      "playRate": "N/A"
    },
    {
      items: [
        "Jeweled Gauntlet",
        "Red Buff",
        "Spear of Shojin"
      ],
      "avgPlace": "4.19",
      "placeChange": "4.19",
      "playRate": "N/A"
    },
    {
      items: [
        "Spear of Hirana",
        "Jeweled Gauntlet",
        "Nashor's Tooth"
      ],
      "avgPlace": "3.74",
      "placeChange": "3.74",
      "playRate": "N/A"
    },
    {
      items: [
        "Manazane",
        "Jeweled Gauntlet",
        "Spear of Shojin"
      ],
      "avgPlace": "3.67",
      "placeChange": "3.67",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Nashor's Tooth",
        "Spear of Shojin"
      ],
      "avgPlace": "4.45",
      "placeChange": "4.45",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Zoe",
  top5Builds: [
    {
      items: [
        "Jeweled Gauntlet",
        "Guardbreaker",
        "Spear of Shojin"
      ],
      "avgPlace": "4.04",
      "placeChange": "4.04",
      "playRate": "N/A"
    },
    {
      items: [
        "Jeweled Gauntlet",
        "Rabadon's Deathcap",
        "Spear of Shojin"
      ],
      "avgPlace": "4.08",
      "placeChange": "4.08",
      "playRate": "N/A"
    },
    {
      items: [
        "Guinsoo's Rageblade",
        "Jeweled Gauntlet",
        "Guardbreaker"
      ],
      "avgPlace": "4.12",
      "placeChange": "4.12",
      "playRate": "N/A"
    },
    {
      items: [
        "Guinsoo's Rageblade",
        "Jeweled Gauntlet",
        "Rabadon's Deathcap"
      ],
      "avgPlace": "3.64",
      "placeChange": "3.64",
      "playRate": "N/A"
    },
    {
      items: [
        "Nashor's Tooth",
        "Rabadon's Deathcap",
        "Spear of Shojin"
      ],
      "avgPlace": "4.21",
      "placeChange": "4.21",
      "playRate": "N/A"
    }
  ]
},
{
  champion: "Zyra",
  top5Builds: [
    {
      items: [
        "Jeweled Gauntlet",
        "Nashor's Tooth",
        "Spear of Shojin"
      ],
      "avgPlace": "4.62",
      "placeChange": "4.62",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Jeweled Gauntlet",
        "Spear of Shojin"
      ],
      "avgPlace": "4.00",
      "placeChange": "4.00",
      "playRate": "N/A"
    },
    {
      items: [
        "Jeweled Gauntlet",
        "Rabadon's Deathcap",
        "Spear of Shojin"
      ],
      "avgPlace": "3.42",
      "placeChange": "3.42",
      "playRate": "N/A"
    },
    {
      items: [
        "Archangel's Staff",
        "Nashor's Tooth",
        "Spear of Shojin"
      ],
      "avgPlace": "4.33",
      "placeChange": "4.33",
      "playRate": "N/A"
    },
    {
      items: [
        "Jeweled Gauntlet",
        "Giant Slayer",
        "Spear of Shojin"
      ],
      "avgPlace": "3.94",
      "placeChange": "3.94",
      "playRate": "N/A"
    }
  ]
}

];


const championAnomalies = [ 
  {
    name: "Amumu",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Thornskin"
      },
      {
        category: "2nd BIS",
        anomaly: "Stoneskin"
      },
      {
        category: "3rd BIS",
        anomaly: "Dramatic Entrance"
      }
    ]
  },
  {
    name: "Darius",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Diving In"
      },
      {
        category: "2nd BIS",
        anomaly: "Invisibility"
      },
      {
        category: "3rd BIS",
        anomaly: "Stoneskin"
      }
    ]
  },
  {
    name: "Draven",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Ultimate Hero"
      },
      {
        category: "2nd BIS",
        anomaly: "Strength Training"
      },
      {
        category: "3rd BIS",
        anomaly: "Comeback Story"
      }
    ]
  },
  {
    name: "Irelia",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Giant-Sized"
      },
      {
        category: "2nd BIS",
        anomaly: "Deep Roots"
      },
      {
        category: "3rd BIS",
        anomaly: "Dramatic Entrance"
      }
    ]
  },
  {
    name: "Irelia2",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Ultimate Hero"
      },
      {
        category: "2nd BIS",
        anomaly: "Invisibility"
      },
      {
        category: "3rd BIS",
        anomaly: "Last Chance"
      }
    ]
  },
  {
    name: "Lux",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Hypervelocity"
      },
      {
        category: "2nd BIS",
        anomaly: "Kill Streak"
      },
      {
        category: "3rd BIS",
        anomaly: "Headhunter"
      }
    ]
  },
  {
    name: "Maddie",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Ultimate Hero"
      },
      {
        category: "2nd BIS",
        anomaly: "Nothing Wasted"
      },
      {
        category: "3rd BIS",
        anomaly: "Eagle Eye"
      }
    ]
  },
  {
    name: "Morgana",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Ultimate Hero"
      },
      {
        category: "2nd BIS",
        anomaly: "Kill Streak"
      },
      {
        category: "3rd BIS",
        anomaly: "The Finisher"
      }
    ]
  },
  {
    name: "Powder",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Ultimate Hero"
      },
      {
        category: "2nd BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "3rd BIS",
        anomaly: "Nothing Wasted"
      }
    ]
  },
  {
    name: "Powder2",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Ultimate Hero"
      },
      {
        category: "2nd BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "3rd BIS",
        anomaly: "Nothing Wasted"
      }
    ]
  },
  {
    name: "Singed",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Ultimate Hero"
      },
      {
        category: "2nd BIS",
        anomaly: "Deep Roots"
      },
      {
        category: "3rd BIS",
        anomaly: "Dramatic Entrance"
      }
    ]
  },
  {
    name: "Singed2",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Invisibility"
      },
      {
        category: "2nd BIS",
        anomaly: "Slow Cooker"
      },
      {
        category: "3rd BIS",
        anomaly: "Laser Eyes"
      }
    ]
  },
  {
    name: "Steb",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Deep Roots"
      },
      {
        category: "2nd BIS",
        anomaly: "Slime Time"
      },
      {
        category: "3rd BIS",
        anomaly: "Dramatic Entrance"
      }
    ]
  },
  {
    name: "Steb2",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Ultimate Hero"
      },
      {
        category: "2nd BIS",
        anomaly: "Mage Armor"
      },
      {
        category: "3rd BIS",
        anomaly: "Nothing Wasted"
      }
    ]
  },
  {
    name: "Trundle",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Deep Roots"
      },
      {
        category: "2nd BIS",
        anomaly: "Stoneskin"
      },
      {
        category: "3rd BIS",
        anomaly: "Dramatic Entrance"
      }
    ]
  },
  {
    name: "Trundle2",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Ultimate Hero"
      },
      {
        category: "2nd BIS",
        anomaly: "Invisibility"
      },
      {
        category: "3rd BIS",
        anomaly: "Titanic Strikes"
      }
    ]
  },
  {
    name: "Vex",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Nothing Wasted"
      },
      {
        category: "2nd BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "3rd BIS",
        anomaly: "Kill Streak"
      }
    ]
  },
  {
    name: "Violet",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Ultimate Hero"
      },
      {
        category: "2nd BIS",
        anomaly: "Invisibility"
      },
      {
        category: "3rd BIS",
        anomaly: "Comeback Story"
      }
    ]
  },
  {
    name: "Zyra",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "2nd BIS",
        anomaly: "Nothing Wasted"
      },
      {
        category: "3rd BIS",
        anomaly: "Energy Absorption"
      }
    ]
  },
  {
    name: "Akali",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Last Chance"
      },
      {
        category: "2nd BIS",
        anomaly: "Mage Armor"
      },
      {
        category: "3rd BIS",
        anomaly: "Comeback Story"
      }
    ]
  },
  {
    name: "Camille",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Knockout"
      },
      {
        category: "2nd BIS",
        anomaly: "Invisibility"
      },
      {
        category: "3rd BIS",
        anomaly: "Kill Streak"
      }
    ]
  },
  {
    name: "Leona",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Deep Roots"
      },
      {
        category: "2nd BIS",
        anomaly: "Giant-Sized"
      },
      {
        category: "3rd BIS",
        anomaly: "Dramatic Entrance"
      }
    ]
  },
  {
    name: "Nocturne",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Diving In"
      },
      {
        category: "2nd BIS",
        anomaly: "Invisibility"
      },
      {
        category: "3rd BIS",
        anomaly: "Last Chance"
      }
    ]
  },
  {
    name: "Rell",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Giant-Sized"
      },
      {
        category: "2nd BIS",
        anomaly: "Stoneskin"
      },
      {
        category: "3rd BIS",
        anomaly: "Dramatic Entrance"
      }
    ]
  },
  {
    name: "Renata",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Hypervelocity"
      },
      {
        category: "2nd BIS",
        anomaly: "Magic Training"
      },
      {
        category: "3rd BIS",
        anomaly: "Nothing Wasted"
      }
    ]
  },
  {
    name: "Sett",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Stoneskin"
      },
      {
        category: "2nd BIS",
        anomaly: "Dramatic Entrance"
      },
      {
        category: "3rd BIS",
        anomaly: "Giant-Sized"
      }
    ]
  },
  {
    name: "Tristana",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Cull The Weak"
      },
      {
        category: "2nd BIS",
        anomaly: "Headhunter"
      },
      {
        category: "3rd BIS",
        anomaly: "Comeback Story"
      }
    ]
  },
  {
    name: "Urgot",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Hunger for Power"
      },
      {
        category: "2nd BIS",
        anomaly: "Invisibility"
      },
      {
        category: "3rd BIS",
        anomaly: "Last Chance"
      }
    ]
  },
  {
    name: "Vander",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Giant-Sized"
      },
      {
        category: "2nd BIS",
        anomaly: "Dramatic Entrance"
      },
      {
        category: "3rd BIS",
        anomaly: "Stoneskin"
      }
    ]
  },
  {
    name: "Vander2",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Invisibility"
      },
      {
        category: "2nd BIS",
        anomaly: "Kill Streak"
      },
      {
        category: "3rd BIS",
        anomaly: "Stoneskin"
      }
    ]
  },
  {
    name: "Vlad",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Stoneskin"
      },
      {
        category: "2nd BIS",
        anomaly: "Dramatic Entrance"
      },
      {
        category: "3rd BIS",
        anomaly: "Slime Time"
      }
    ]
  },
  {
    name: "Vlad2",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Hypervelocity"
      },
      {
        category: "2nd BIS",
        anomaly: "Nothing Wasted"
      },
      {
        category: "3rd BIS",
        anomaly: "Headhunter"
      }
    ]
  },
  {
    name: "Zeri",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Strength Training"
      },
      {
        category: "2nd BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "3rd BIS",
        anomaly: "Hypervelocity"
      }
    ]
  },
  {
    name: "Ziggs",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Magic Expert"
      },
      {
        category: "2nd BIS",
        anomaly: "Nothing Wasted"
      },
      {
        category: "3rd BIS",
        anomaly: "Energy Absorption"
      }
    ]
  },
  {
    name: "Blitzcrank",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Slime Time"
      },
      {
        category: "2nd BIS",
        anomaly: "Thornskin"
      },
      {
        category: "3rd BIS",
        anomaly: "Stoneskin"
      }
    ]
  },
  {
    name: "Cassiopeia",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Magic Expert"
      },
      {
        category: "2nd BIS",
        anomaly: "Kill Streak"
      },
      {
        category: "3rd BIS",
        anomaly: "Hypervelocity"
      }
    ]
  },
  {
    name: "Ezreal",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "2nd BIS",
        anomaly: "Titanic Strikes"
      },
      {
        category: "3rd BIS",
        anomaly: "Attack Expert"
      }
    ]
  },
  {
    name: "Gangplank",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Deep Roots"
      },
      {
        category: "2nd BIS",
        anomaly: "Invisibility"
      },
      {
        category: "3rd BIS",
        anomaly: "Legacy of Shurima"
      }
    ]
  },
  {
    name: "Gangplank2",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Eagle Eye"
      },
      {
        category: "2nd BIS",
        anomaly: "Cull the Weak"
      },
      {
        category: "3rd BIS",
        anomaly: "Comeback Story"
      }
    ]
  },
  {
    name: "Kogmaw",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "One Thousand Cuts"
      },
      {
        category: "2nd BIS",
        anomaly: "Magic Training"
      },
      {
        category: "3rd BIS",
        anomaly: "Hypervelocity"
      }
    ]
  },
  {
    name: "Loris",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Giant-Sized"
      },
      {
        category: "2nd BIS",
        anomaly: "Fortified"
      },
      {
        category: "3rd BIS",
        anomaly: "Dramatic Entrance"
      }
    ]
  },
  {
    name: "Nami",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "2nd BIS",
        anomaly: "Energy Absorption"
      },
      {
        category: "3rd BIS",
        anomaly: "Headhunter"
      }
    ]
  },
  {
    name: "Nunu and Willump",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Slow Cooker"
      },
      {
        category: "2nd BIS",
        anomaly: "Stoneskin"
      },
      {
        category: "3rd BIS",
        anomaly: "Dramatic Entrance"
      }
    ]
  },
  {
    name: "Renni",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Giant-Sized"
      },
      {
        category: "2nd BIS",
        anomaly: "Stoneskin"
      },
      {
        category: "3rd BIS",
        anomaly: "Legacy of Shurima"
      }
    ]
  },
  {
    name: "Renni2",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Invisibility"
      },
      {
        category: "2nd BIS",
        anomaly: "Last Chance"
      },
      {
        category: "3rd BIS",
        anomaly: "Legacy of Shurima"
      }
    ]
  },
  {
    name: "Scar",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Deep Roots"
      },
      {
        category: "2nd BIS",
        anomaly: "Stoneskin"
      },
      {
        category: "3rd BIS",
        anomaly: "Dramatic Entrance"
      }
    ]
  },
  {
    name: "Swain",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Stoneskin"
      },
      {
        category: "2nd BIS",
        anomaly: "Diving In"
      },
      {
        category: "3rd BIS",
        anomaly: "Slow Cooker"
      }
    ]
  },
  {
    name: "Swain2",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "2nd BIS",
        anomaly: "Energy Absorption"
      },
      {
        category: "3rd BIS",
        anomaly: "Magic Expert"
      }
    ]
  },
  {
    name: "Twisted Fate",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "2nd BIS",
        anomaly: "Nothing Wasted"
      },
      {
        category: "3rd BIS",
        anomaly: "Magic Expert"
      }
    ]
  },
  {
    name: "Ambessa",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Invisibility"
      },
      {
        category: "2nd BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "3rd BIS",
        anomaly: "Berserker Rage"
      }
    ]
  },
  {
    name: "Corki",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "2nd BIS",
        anomaly: "Attack Expert"
      },
      {
        category: "3rd BIS",
        anomaly: "Touch of Frost"
      }
    ]
  },
  {
    name: "Dr. Mundo",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Stoneskin"
      },
      {
        category: "2nd BIS",
        anomaly: "Slow Cooker"
      },
      {
        category: "3rd BIS",
        anomaly: "Dramatic Entrance"
      }
    ]
  },
  {
    name: "Ekko",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Mage Armor"
      },
      {
        category: "2nd BIS",
        anomaly: "Stoneskin"
      },
      {
        category: "3rd BIS",
        anomaly: "Bulwark"
      }
    ]
  },
  {
    name: "Elise",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Dramatic Entrance"
      },
      {
        category: "2nd BIS",
        anomaly: "Stoneskin"
      },
      {
        category: "3rd BIS",
        anomaly: "Giant-Sized"
      }
    ]
  },
  {
    name: "Elise2",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Magic Expert"
      },
      {
        category: "2nd BIS",
        anomaly: "Nothing Wasted"
      },
      {
        category: "3rd BIS",
        anomaly: "Comeback Story"
      }
    ]
  },
  {
    name: "Garen",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Deep Roots"
      },
      {
        category: "2nd BIS",
        anomaly: "Stoneskin"
      },
      {
        category: "3rd BIS",
        anomaly: "Giant-Sized"
      }
    ]
  },
  {
    name: "Heimerdinger",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Kill Streak"
      },
      {
        category: "2nd BIS",
        anomaly: "Nothing Wasted"
      },
      {
        category: "3rd BIS",
        anomaly: "Magic Training"
      }
    ]
  },
  {
    name: "Illaoi",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Giant-Sized"
      },
      {
        category: "2nd BIS",
        anomaly: "Deep Roots"
      },
      {
        category: "3rd BIS",
        anomaly: "Dramatic Entrance"
      }
    ]
  },
  {
    name: "Silco",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Nothing Wasted"
      },
      {
        category: "2nd BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "3rd BIS",
        anomaly: "Headhunter"
      }
    ]
  },
  {
    name: "Twitch",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Dragonsoul"
      },
      {
        category: "2nd BIS",
        anomaly: "Strength Training"
      },
      {
        category: "3rd BIS",
        anomaly: "Eagle Eye"
      }
    ]
  },
  {
    name: "Vi",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Invisibility"
      },
      {
        category: "2nd BIS",
        anomaly: "Last Chance"
      },
      {
        category: "3rd BIS",
        anomaly: "Berserker Rage"
      }
    ]
  },
  {
    name: "Zoe",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Kill Streak"
      },
      {
        category: "2nd BIS",
        anomaly: "Nothing Wasted"
      },
      {
        category: "3rd BIS",
        anomaly: "Comeback Story"
      }
    ]
  },
  {
    name: "Caitlyn",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Touch of Frost"
      },
      {
        category: "2nd BIS",
        anomaly: "Eagle Eye"
      },
      {
        category: "3rd BIS",
        anomaly: "Dragonsoul"
      }
    ]
  },
  {
    name: "Jayce",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Berserker Rage"
      },
      {
        category: "2nd BIS",
        anomaly: "Invisibility"
      },
      {
        category: "3rd BIS",
        anomaly: "Deep Roots"
      }
    ]
  },
  {
    name: "Jayce2",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Nothing Wasted"
      },
      {
        category: "2nd BIS",
        anomaly: "Eagle Eye"
      },
      {
        category: "3rd BIS",
        anomaly: "Comeback Story"
      }
    ]
  },
  {
    name: "Jinx",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Nothing Wasted"
      },
      {
        category: "2nd BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "3rd BIS",
        anomaly: "Attack Expert"
      }
    ]
  },
  {
    name: "LeBlanc",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Nothing Wasted"
      },
      {
        category: "2nd BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "3rd BIS",
        anomaly: "Kill Streak"
      }
    ]
  },
  {
    name: "Malzahar",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Nothing Wasted"
      },
      {
        category: "2nd BIS",
        anomaly: "Kill Streak"
      },
      {
        category: "3rd BIS",
        anomaly: "Comeback Story"
      }
    ]
  },
  {
    name: "Mordekaiser",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Invisibility"
      },
      {
        category: "2nd BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "3rd BIS",
        anomaly: "Legacy of Shurima"
      }
    ]
  },
  {
    name: "Rumble",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Invisibility"
      },
      {
        category: "2nd BIS",
        anomaly: "Last Chance"
      },
      {
        category: "3rd BIS",
        anomaly: "Comeback Story"
      }
    ]
  },
  {
    name: "Sevika",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Invisibility"
      },
      {
        category: "2nd BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "3rd BIS",
        anomaly: "Diving In"
      }
    ]
  },
  {
    name: "Smeech",
    anomalies: [
      {
        category: "1st BIS",
        anomaly: "Invisibility"
      },
      {
        category: "2nd BIS",
        anomaly: "Comeback Story"
      },
      {
        category: "3rd BIS",
        anomaly: "The Finisher"
      }
    ]
  }

]; 


const championStats = [
  {
    name: "Viktor",
    "placement": "2.85",
    "frequency": "125,524 15.5%",
    recommendedItems: [
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Rabadon's Deathcap",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_rabadonsdeathcap.png"
      },
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Giant Slayer",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_madredsbloodrazor.png"
      }
    ],
    stats: {
      Health: "1600/2880/5184",
      Mana: "0/100",
      AttackDamage: "100/150/225",
      AbilityPower: "100",
      Armor: "40",
      MagicResist: "40",
      AttackSpeed: "0.55",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Mel",
    "link": "https://www.metatft.com/units/MissMage",
    "tier": "S",
    "placement": "3.10",
    "frequency": "89,501 11.0%",
    recommendedItems: [
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Blue Buff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bluebuff.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Hextech Gunblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_hextechgunblade.png"
      }
    ],
    stats: {
      Health: "1800/3240/5832",
      Mana: "0/40",
      AttackDamage: "80/120/180",
      AbilityPower: "100",
      Armor: "60",
      MagicResist: "60",
      AttackSpeed: "0.8",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "3"
    }
  },
  {
    name: "Warwick",
    "link": "https://www.metatft.com/units/Warwick",
    "tier": "S",
    "placement": "3.24",
    "frequency": "78,008 9.6%",
    recommendedItems: [
      {
        itemName1: "Bloodthirster",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bloodthirster.png"
      },
      {
        itemName1: "Titan's Resolve",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_titansresolve.png"
      },
      {
        itemName1: "Hand Of Justice",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_unstableconcoction.png"
      },
      {
        itemName1: "Sterak's Gage",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_steraksgage.png"
      },
      {
        itemName1: "Guinsoo's Rageblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guinsoosrageblade.png"
      }
    ],
    stats: {
      Health: "2100/3780/6804",
      Mana: "60/100",
      AttackDamage: "100/150/225",
      AbilityPower: "100",
      Armor: "70",
      MagicResist: "70",
      AttackSpeed: "0.9",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Sevika",
    "link": "https://www.metatft.com/units/Lieutenant",
    "tier": "S",
    "placement": "3.74",
    "frequency": "94,444 11.6%",
    recommendedItems: [
      {
        itemName1: "Bloodthirster",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bloodthirster.png"
      },
      {
        itemName1: "Titan's Resolve",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_titansresolve.png"
      },
      {
        itemName1: "Hand Of Justice",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_unstableconcoction.png"
      },
      {
        itemName1: "Sterak's Gage",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_steraksgage.png"
      },
      {
        itemName1: "Thief's Gloves",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_thiefsgloves.png"
      }
    ],
    stats: {
      Health: "1200/2160/3888",
      Mana: "0/60",
      AttackDamage: "80/120/180",
      AbilityPower: "100",
      Armor: "60",
      MagicResist: "60",
      AttackSpeed: "0.9",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Hextech Forge",
    "link": "https://www.metatft.com/units/JayceSummon",
    "tier": "S",
    "placement": "3.85",
    "frequency": "131,279 16.2%",
    recommendedItems: [],
    stats: {
      Health: "/0/0",
      Mana: "0/0",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "0",
      AttackSpeed: "0.5",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "10"
    }
  },
  {
    name: "Jayce",
    "link": "https://www.metatft.com/units/Jayce",
    "tier": "S",
    "placement": "3.86",
    "frequency": "132,811 16.3%",
    recommendedItems: [
      {
        itemName1: "Infinity Edge",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_infinityedge.png"
      },
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Guinsoo's Rageblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guinsoosrageblade.png"
      },
      {
        itemName1: "Last Whisper",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_lastwhisper.png"
      },
      {
        itemName1: "Giant Slayer",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_madredsbloodrazor.png"
      }
    ],
    stats: {
      Health: "900/1620/2916",
      Mana: "0/10",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "0",
      AttackSpeed: "0.5",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Rumble",
    "link": "https://www.metatft.com/units/Rumble",
    "tier": "S",
    "placement": "3.94",
    "frequency": "172,007 21.2%",
    recommendedItems: [
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Hand Of Justice",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_unstableconcoction.png"
      },
      {
        itemName1: "Crownguard",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_crownguard.png"
      },
      {
        itemName1: "Bloodthirster",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bloodthirster.png"
      },
      {
        itemName1: "Thief's Gloves",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_thiefsgloves.png"
      }
    ],
    stats: {
      Health: "1200/2160/3888",
      Mana: "40/120",
      AttackDamage: "60/90/135",
      AbilityPower: "100",
      Armor: "70",
      MagicResist: "70",
      AttackSpeed: "0.8",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Mordekaiser",
    "link": "https://www.metatft.com/units/Mordekaiser",
    "tier": "S",
    "placement": "3.95",
    "frequency": "137,625 16.9%",
    recommendedItems: [
      {
        itemName1: "Hand Of Justice",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_unstableconcoction.png"
      },
      {
        itemName1: "Bloodthirster",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bloodthirster.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Titan's Resolve",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_titansresolve.png"
      },
      {
        itemName1: "Thief's Gloves",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_thiefsgloves.png"
      }
    ],
    stats: {
      Health: "1200/2160/3888",
      Mana: "25/100",
      AttackDamage: "75/113/169",
      AbilityPower: "100",
      Armor: "70",
      MagicResist: "70",
      AttackSpeed: "0.55",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "LeBlanc",
    "link": "https://www.metatft.com/units/LeBlanc",
    "tier": "S",
    "placement": "3.97",
    "frequency": "116,547 14.3%",
    recommendedItems: [
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Nashor's Tooth",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_leviathan.png"
      },
      {
        itemName1: "Statikk Shiv",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_statikkshiv.png"
      }
    ],
    stats: {
      Health: "900/1620/2916",
      Mana: "45/90",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "40",
      MagicResist: "40",
      AttackSpeed: "0.8",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Caitlyn",
    "link": "https://www.metatft.com/units/Caitlyn",
    "tier": "S",
    "placement": "4.01",
    "frequency": "88,719 10.9%",
    recommendedItems: [
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Infinity Edge",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_infinityedge.png"
      },
      {
        itemName1: "Last Whisper",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_lastwhisper.png"
      },
      {
        itemName1: "Guinsoo's Rageblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guinsoosrageblade.png"
      },
      {
        itemName1: "Giant Slayer",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_madredsbloodrazor.png"
      }
    ],
    stats: {
      Health: "900/1620/2916",
      Mana: "0/50",
      AttackDamage: "82/123/185",
      AbilityPower: "100",
      Armor: "40",
      MagicResist: "40",
      AttackSpeed: "0.55",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "13"
    }
  },
  {
    name: "Violet",
    "link": "https://www.metatft.com/units/Red",
    "tier": "S",
    "placement": "4.07",
    "frequency": "58,822 7.2%",
    recommendedItems: [
      {
        itemName1: "Bloodthirster",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bloodthirster.png"
      },
      {
        itemName1: "Titan's Resolve",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_titansresolve.png"
      },
      {
        itemName1: "Sterak's Gage",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_steraksgage.png"
      },
      {
        itemName1: "Hand Of Justice",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_unstableconcoction.png"
      },
      {
        itemName1: "Edge of Night",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guardianangel.png"
      }
    ],
    stats: {
      Health: "650/1170/2106",
      Mana: "20/65",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "40",
      MagicResist: "40",
      AttackSpeed: "0.8",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Jinx",
    "link": "https://www.metatft.com/units/Jinx",
    "tier": "S",
    "placement": "4.12",
    "frequency": "89,426 11.0%",
    recommendedItems: [
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Infinity Edge",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_infinityedge.png"
      },
      {
        itemName1: "Last Whisper",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_lastwhisper.png"
      },
      {
        itemName1: "Guinsoo's Rageblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guinsoosrageblade.png"
      },
      {
        itemName1: "Giant Slayer",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_madredsbloodrazor.png"
      }
    ],
    stats: {
      Health: "900/1620/2916",
      Mana: "0/60",
      AttackDamage: "60/90/135",
      AbilityPower: "100",
      Armor: "40",
      MagicResist: "40",
      AttackSpeed: "0.8",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Malzahar",
    "link": "https://www.metatft.com/units/Malzahar",
    "tier": "S",
    "placement": "4.15",
    "frequency": "119,412 14.7%",
    recommendedItems: [
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Nashor's Tooth",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_leviathan.png"
      },
      {
        itemName1: "Red Buff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_rapidfirecannon.png"
      }
    ],
    stats: {
      Health: "950/1710/3078",
      Mana: "30/95",
      AttackDamage: "45/68/101",
      AbilityPower: "100",
      Armor: "40",
      MagicResist: "40",
      AttackSpeed: "0.8",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Vander",
    "link": "https://www.metatft.com/units/Prime",
    "tier": "S",
    "placement": "4.19",
    "frequency": "76,834 9.5%",
    recommendedItems: [
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Redemption",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redemption.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      }
    ],
    stats: {
      Health: "800/1440/2592",
      Mana: "0/50",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "45",
      MagicResist: "45",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Vi",
    "link": "https://www.metatft.com/units/Vi",
    "tier": "A",
    "placement": "4.28",
    "frequency": "150,168 18.5%",
    recommendedItems: [
      {
        itemName1: "Bloodthirster",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bloodthirster.png"
      },
      {
        itemName1: "Titan's Resolve",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_titansresolve.png"
      },
      {
        itemName1: "Sterak's Gage",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_steraksgage.png"
      },
      {
        itemName1: "Hand Of Justice",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_unstableconcoction.png"
      },
      {
        itemName1: "Thief's Gloves",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_thiefsgloves.png"
      }
    ],
    stats: {
      Health: "1100/1980/3564",
      Mana: "40/100",
      AttackDamage: "75/113/169",
      AbilityPower: "100",
      Armor: "50",
      MagicResist: "50",
      AttackSpeed: "0.85",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Powder",
    "link": "https://www.metatft.com/units/Blue",
    "tier": "A",
    "placement": "4.29",
    "frequency": "85,521 10.5%",
    recommendedItems: [
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Rabadon's Deathcap",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_rabadonsdeathcap.png"
      },
      {
        itemName1: "Tear of the Goddess",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_tearofthegoddess.png"
      }
    ],
    stats: {
      Health: "500/900/1620",
      Mana: "40/120",
      AttackDamage: "35/53/79",
      AbilityPower: "100",
      Armor: "15",
      MagicResist: "15",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Draven",
    "link": "https://www.metatft.com/units/Draven",
    "tier": "A",
    "placement": "4.29",
    "frequency": "81,409 10.0%",
    recommendedItems: [
      {
        itemName1: "Guinsoo's Rageblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guinsoosrageblade.png"
      },
      {
        itemName1: "Last Whisper",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_lastwhisper.png"
      },
      {
        itemName1: "Infinity Edge",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_infinityedge.png"
      },
      {
        itemName1: "Giant Slayer",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_madredsbloodrazor.png"
      },
      {
        itemName1: "Deathblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_deathblade.png"
      }
    ],
    stats: {
      Health: "500/900/1620",
      Mana: "30/60",
      AttackDamage: "55/83/124",
      AbilityPower: "100",
      Armor: "15",
      MagicResist: "15",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Urgot",
    "link": "https://www.metatft.com/units/Urgot",
    "tier": "A",
    "placement": "4.38",
    "frequency": "111,882 13.8%",
    recommendedItems: [
      {
        itemName1: "Bloodthirster",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bloodthirster.png"
      },
      {
        itemName1: "Hand Of Justice",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_unstableconcoction.png"
      },
      {
        itemName1: "Titan's Resolve",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_titansresolve.png"
      },
      {
        itemName1: "Sterak's Gage",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_steraksgage.png"
      },
      {
        itemName1: "Thief's Gloves",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_thiefsgloves.png"
      }
    ],
    stats: {
      Health: "700/1260/2268",
      Mana: "20/70",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "45",
      MagicResist: "45",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "2"
    }
  },
  {
    name: "Illaoi",
    "link": "https://www.metatft.com/units/Illaoi",
    "tier": "A",
    "placement": "4.40",
    "frequency": "234,864 28.9%",
    recommendedItems: [
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      },
      {
        itemName1: "Bramble Vest",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bramblevest.png"
      }
    ],
    stats: {
      Health: "1100/1980/3564",
      Mana: "65/125",
      AttackDamage: "70/105/158",
      AbilityPower: "100",
      Armor: "60",
      MagicResist: "60",
      AttackSpeed: "0.65",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Gangplank",
    "link": "https://www.metatft.com/units/Gangplank",
    "tier": "B",
    "placement": "4.40",
    "frequency": "143,032 17.6%",
    recommendedItems: [
      {
        itemName1: "Infinity Edge",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_infinityedge.png"
      },
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Last Whisper",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_lastwhisper.png"
      },
      {
        itemName1: "Guinsoo's Rageblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guinsoosrageblade.png"
      },
      {
        itemName1: "Giant Slayer",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_madredsbloodrazor.png"
      }
    ],
    stats: {
      Health: "700/1260/2268",
      Mana: "0/10",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "0",
      AttackSpeed: "0.5",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Silco",
    "link": "https://www.metatft.com/units/Silco",
    "tier": "B",
    "placement": "4.40",
    "frequency": "129,423 15.9%",
    recommendedItems: [
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Nashor's Tooth",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_leviathan.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Rabadon's Deathcap",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_rabadonsdeathcap.png"
      }
    ],
    stats: {
      Health: "800/1440/2592",
      Mana: "30/80",
      AttackDamage: "40/60/90",
      AbilityPower: "100",
      Armor: "30",
      MagicResist: "30",
      AttackSpeed: "0.75",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Ekko",
    "link": "https://www.metatft.com/units/Ekko",
    "tier": "B",
    "placement": "4.41",
    "frequency": "112,479 13.8%",
    recommendedItems: [
      {
        itemName1: "Hand Of Justice",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_unstableconcoction.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Ionic Spark",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_ionicspark.png"
      },
      {
        itemName1: "Needlessly Large Rod",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_needlesslylargerod.png"
      },
      {
        itemName1: "Bloodthirster",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bloodthirster.png"
      }
    ],
    stats: {
      Health: "1100/1980/3564",
      Mana: "0/60",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "60",
      MagicResist: "60",
      AttackSpeed: "0.85",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Darius",
    "link": "https://www.metatft.com/units/Darius",
    "tier": "B",
    "placement": "4.41",
    "frequency": "76,971 9.5%",
    recommendedItems: [
      {
        itemName1: "Bloodthirster",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bloodthirster.png"
      },
      {
        itemName1: "Thief's Gloves",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_thiefsgloves.png"
      },
      {
        itemName1: "Sterak's Gage",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_steraksgage.png"
      },
      {
        itemName1: "Family Emblem",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft13_item_familyemblemitem.png"
      },
      {
        itemName1: "Titan's Resolve",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_titansresolve.png"
      }
    ],
    stats: {
      Health: "600/1080/1944",
      Mana: "30/70",
      AttackDamage: "55/83/124",
      AbilityPower: "100",
      Armor: "40",
      MagicResist: "40",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Ezreal",
    "link": "https://www.metatft.com/units/Ezreal",
    "tier": "B",
    "placement": "4.42",
    "frequency": "159,017 19.6%",
    recommendedItems: [
      {
        itemName1: "Infinity Edge",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_infinityedge.png"
      },
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Guinsoo's Rageblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guinsoosrageblade.png"
      },
      {
        itemName1: "Last Whisper",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_lastwhisper.png"
      },
      {
        itemName1: "Giant Slayer",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_madredsbloodrazor.png"
      }
    ],
    stats: {
      Health: "700/1260/2268",
      Mana: "0/60",
      AttackDamage: "60/90/135",
      AbilityPower: "100",
      Armor: "25",
      MagicResist: "25",
      AttackSpeed: "0.75",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Sion",
    "link": "https://www.metatft.com/units/Sion",
    "tier": "B",
    "placement": "4.43",
    "frequency": "140,366 17.3%",
    recommendedItems: [],
    stats: {
      Health: "750/1350/2430",
      Mana: "120/120",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "0",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Irelia",
    "link": "https://www.metatft.com/units/Irelia",
    "tier": "B",
    "placement": "4.43",
    "frequency": "188,069 23.1%",
    recommendedItems: [
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      },
      {
        itemName1: "Thief's Gloves",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_thiefsgloves.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      }
    ],
    stats: {
      Health: "700/1260/2268",
      Mana: "30/70",
      AttackDamage: "45/68/101",
      AbilityPower: "100",
      Armor: "40",
      MagicResist: "40",
      AttackSpeed: "0.6",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Zoe",
    "link": "https://www.metatft.com/units/Zoe",
    "tier": "B",
    "placement": "4.44",
    "frequency": "100,604 12.4%",
    recommendedItems: [
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Nashor's Tooth",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_leviathan.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Rabadon's Deathcap",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_rabadonsdeathcap.png"
      }
    ],
    stats: {
      Health: "800/1440/2592",
      Mana: "20/80",
      AttackDamage: "40/60/90",
      AbilityPower: "100",
      Armor: "30",
      MagicResist: "30",
      AttackSpeed: "0.75",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Elise",
    "link": "https://www.metatft.com/units/Elise",
    "tier": "B",
    "placement": "4.44",
    "frequency": "286,021 35.2%",
    recommendedItems: [
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Thief's Gloves",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_thiefsgloves.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      }
    ],
    stats: {
      Health: "750/1350/2430",
      Mana: "0/10",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "0",
      AttackSpeed: "0.5",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Dr. Mundo",
    "link": "https://www.metatft.com/units/DrMundo",
    "tier": "B",
    "placement": "4.45",
    "frequency": "203,859 25.1%",
    recommendedItems: [
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      },
      {
        itemName1: "Redemption",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redemption.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      }
    ],
    stats: {
      Health: "1100/1980/3564",
      Mana: "30/100",
      AttackDamage: "60/90/135",
      AbilityPower: "100",
      Armor: "60",
      MagicResist: "60",
      AttackSpeed: "0.65",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Ambessa",
    "link": "https://www.metatft.com/units/Ambessa",
    "tier": "B",
    "placement": "4.45",
    "frequency": "188,277 23.2%",
    recommendedItems: [
      {
        itemName1: "Bloodthirster",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bloodthirster.png"
      },
      {
        itemName1: "Titan's Resolve",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_titansresolve.png"
      },
      {
        itemName1: "Hand Of Justice",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_unstableconcoction.png"
      },
      {
        itemName1: "Sterak's Gage",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_steraksgage.png"
      },
      {
        itemName1: "Edge of Night",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guardianangel.png"
      }
    ],
    stats: {
      Health: "1100/1980/3564",
      Mana: "40/90",
      AttackDamage: "65/98/146",
      AbilityPower: "100",
      Armor: "50",
      MagicResist: "50",
      AttackSpeed: "0.8",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Twisted Fate",
    "link": "https://www.metatft.com/units/TwistedFate",
    "tier": "B",
    "placement": "4.45",
    "frequency": "105,255 13.0%",
    recommendedItems: [
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Guinsoo's Rageblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guinsoosrageblade.png"
      },
      {
        itemName1: "Nashor's Tooth",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_leviathan.png"
      }
    ],
    stats: {
      Health: "700/1260/2268",
      Mana: "25/75",
      AttackDamage: "35/53/79",
      AbilityPower: "100",
      Armor: "25",
      MagicResist: "25",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Akali",
    "link": "https://www.metatft.com/units/Akali",
    "tier": "B",
    "placement": "4.46",
    "frequency": "108,157 13.3%",
    recommendedItems: [
      {
        itemName1: "Hand Of Justice",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_unstableconcoction.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Bloodthirster",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bloodthirster.png"
      },
      {
        itemName1: "Thief's Gloves",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_thiefsgloves.png"
      },
      {
        itemName1: "Titan's Resolve",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_titansresolve.png"
      }
    ],
    stats: {
      Health: "700/1260/2268",
      Mana: "0/60",
      AttackDamage: "45/68/101",
      AbilityPower: "100",
      Armor: "45",
      MagicResist: "45",
      AttackSpeed: "0.75",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Nocturne",
    "link": "https://www.metatft.com/units/Nocturne",
    "tier": "B",
    "placement": "4.47",
    "frequency": "76,721 9.4%",
    recommendedItems: [
      {
        itemName1: "Bloodthirster",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bloodthirster.png"
      },
      {
        itemName1: "Titan's Resolve",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_titansresolve.png"
      },
      {
        itemName1: "Hand Of Justice",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_unstableconcoction.png"
      },
      {
        itemName1: "Quicksilver",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_quicksilver.png"
      },
      {
        itemName1: "Infinity Edge",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_infinityedge.png"
      }
    ],
    stats: {
      Health: "700/1260/2268",
      Mana: "0/40",
      AttackDamage: "65/98/146",
      AbilityPower: "100",
      Armor: "45",
      MagicResist: "45",
      AttackSpeed: "0.8",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Corki",
    "link": "https://www.metatft.com/units/Corki",
    "tier": "B",
    "placement": "4.48",
    "frequency": "149,424 18.4%",
    recommendedItems: [
      {
        itemName1: "Infinity Edge",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_infinityedge.png"
      },
      {
        itemName1: "Last Whisper",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_lastwhisper.png"
      },
      {
        itemName1: "Giant Slayer",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_madredsbloodrazor.png"
      },
      {
        itemName1: "Guinsoo's Rageblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guinsoosrageblade.png"
      },
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      }
    ],
    stats: {
      Health: "850/1530/2754",
      Mana: "0/60",
      AttackDamage: "65/98/146",
      AbilityPower: "100",
      Armor: "30",
      MagicResist: "30",
      AttackSpeed: "0.75",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Blitzcrank",
    "link": "https://www.metatft.com/units/Blitzcrank",
    "tier": "B",
    "placement": "4.49",
    "frequency": "137,904 17.0%",
    recommendedItems: [
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      },
      {
        itemName1: "Redemption",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redemption.png"
      }
    ],
    stats: {
      Health: "850/1530/2754",
      Mana: "20/70",
      AttackDamage: "60/90/135",
      AbilityPower: "100",
      Armor: "50",
      MagicResist: "50",
      AttackSpeed: "0.6",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Sett",
    "link": "https://www.metatft.com/units/Sett",
    "tier": "B",
    "placement": "4.49",
    "frequency": "120,472 14.8%",
    recommendedItems: [
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      },
      {
        itemName1: "Thief's Gloves",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_thiefsgloves.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      }
    ],
    stats: {
      Health: "850/1530/2754",
      Mana: "50/100",
      AttackDamage: "60/90/135",
      AbilityPower: "100",
      Armor: "50",
      MagicResist: "50",
      AttackSpeed: "0.6",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Amumu",
    "link": "https://www.metatft.com/units/Amumu",
    "tier": "B",
    "placement": "4.51",
    "frequency": "84,267 10.4%",
    recommendedItems: [
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      },
      {
        itemName1: "Thief's Gloves",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_thiefsgloves.png"
      }
    ],
    stats: {
      Health: "600/1080/1944",
      Mana: "0/0",
      AttackDamage: "45/68/101",
      AbilityPower: "100",
      Armor: "35",
      MagicResist: "35",
      AttackSpeed: "0.6",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Cassiopeia",
    "link": "https://www.metatft.com/units/Cassiopeia",
    "tier": "B",
    "placement": "4.51",
    "frequency": "129,330 15.9%",
    recommendedItems: [
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Nashor's Tooth",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_leviathan.png"
      },
      {
        itemName1: "Blue Buff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bluebuff.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      }
    ],
    stats: {
      Health: "700/1260/2268",
      Mana: "10/40",
      AttackDamage: "40/60/90",
      AbilityPower: "100",
      Armor: "25",
      MagicResist: "25",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Leona",
    "link": "https://www.metatft.com/units/Leona",
    "tier": "B",
    "placement": "4.52",
    "frequency": "121,162 14.9%",
    recommendedItems: [
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      },
      {
        itemName1: "Bramble Vest",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bramblevest.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      }
    ],
    stats: {
      Health: "800/1440/2592",
      Mana: "50/90",
      AttackDamage: "55/83/124",
      AbilityPower: "100",
      Armor: "50",
      MagicResist: "50",
      AttackSpeed: "0.6",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Twitch",
    "link": "https://www.metatft.com/units/Twitch",
    "tier": "B",
    "placement": "4.54",
    "frequency": "91,636 11.3%",
    recommendedItems: [
      {
        itemName1: "Guinsoo's Rageblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guinsoosrageblade.png"
      },
      {
        itemName1: "Infinity Edge",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_infinityedge.png"
      },
      {
        itemName1: "Last Whisper",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_lastwhisper.png"
      },
      {
        itemName1: "Red Buff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_rapidfirecannon.png"
      },
      {
        itemName1: "Giant Slayer",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_madredsbloodrazor.png"
      }
    ],
    stats: {
      Health: "800/1440/2592",
      Mana: "0/60",
      AttackDamage: "70/105/158",
      AbilityPower: "100",
      Armor: "30",
      MagicResist: "30",
      AttackSpeed: "0.75",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "6"
    }
  },
  {
    name: "Kog'Maw",
    "link": "https://www.metatft.com/units/KogMaw",
    "tier": "B",
    "placement": "4.54",
    "frequency": "83,216 10.2%",
    recommendedItems: [
      {
        itemName1: "Guinsoo's Rageblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guinsoosrageblade.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Hextech Gunblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_hextechgunblade.png"
      },
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      }
    ],
    stats: {
      Health: "650/1170/2106",
      Mana: "0/40",
      AttackDamage: "15/23/34",
      AbilityPower: "100",
      Armor: "25",
      MagicResist: "25",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Steb",
    "link": "https://www.metatft.com/units/Fish",
    "tier": "B",
    "placement": "4.55",
    "frequency": "63,562 7.8%",
    recommendedItems: [
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      },
      {
        itemName1: "Redemption",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redemption.png"
      }
    ],
    stats: {
      Health: "650/1170/2106",
      Mana: "30/90",
      AttackDamage: "55/83/124",
      AbilityPower: "100",
      Armor: "45",
      MagicResist: "45",
      AttackSpeed: "0.55",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Vladimir",
    "link": "https://www.metatft.com/units/Vladimir",
    "tier": "B",
    "placement": "4.56",
    "frequency": "175,767 21.6%",
    recommendedItems: [
      {
        itemName1: "Thief's Gloves",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_thiefsgloves.png"
      },
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      }
    ],
    stats: {
      Health: "800/1440/2592",
      Mana: "0/65",
      AttackDamage: "45/68/101",
      AbilityPower: "100",
      Armor: "45",
      MagicResist: "45",
      AttackSpeed: "0.65",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Heimerdinger",
    "link": "https://www.metatft.com/units/Heimerdinger",
    "tier": "B",
    "placement": "4.56",
    "frequency": "128,749 15.8%",
    recommendedItems: [
      {
        itemName1: "Blue Buff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bluebuff.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Hextech Gunblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_hextechgunblade.png"
      },
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      }
    ],
    stats: {
      Health: "800/1440/2592",
      Mana: "0/40",
      AttackDamage: "40/60/90",
      AbilityPower: "100",
      Armor: "30",
      MagicResist: "30",
      AttackSpeed: "0.75",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Tristana",
    "link": "https://www.metatft.com/units/Tristana",
    "tier": "B",
    "placement": "4.57",
    "frequency": "123,357 15.2%",
    recommendedItems: [
      {
        itemName1: "Guinsoo's Rageblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guinsoosrageblade.png"
      },
      {
        itemName1: "Infinity Edge",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_infinityedge.png"
      },
      {
        itemName1: "Last Whisper",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_lastwhisper.png"
      },
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Giant Slayer",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_madredsbloodrazor.png"
      }
    ],
    stats: {
      Health: "550/990/1782",
      Mana: "20/60",
      AttackDamage: "42/63/95",
      AbilityPower: "100",
      Armor: "20",
      MagicResist: "20",
      AttackSpeed: "0.75",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Nami",
    "link": "https://www.metatft.com/units/Nami",
    "tier": "B",
    "placement": "4.59",
    "frequency": "117,560 14.5%",
    recommendedItems: [
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Nashor's Tooth",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_leviathan.png"
      },
      {
        itemName1: "Rabadon's Deathcap",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_rabadonsdeathcap.png"
      }
    ],
    stats: {
      Health: "700/1260/2268",
      Mana: "0/60",
      AttackDamage: "40/60/90",
      AbilityPower: "100",
      Armor: "25",
      MagicResist: "25",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Garen",
    "link": "https://www.metatft.com/units/Garen",
    "tier": "B",
    "placement": "4.59",
    "frequency": "253,898 31.3%",
    recommendedItems: [
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      },
      {
        itemName1: "Redemption",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redemption.png"
      }
    ],
    stats: {
      Health: "1000/1800/3240",
      Mana: "60/125",
      AttackDamage: "65/98/146",
      AbilityPower: "100",
      Armor: "60",
      MagicResist: "60",
      AttackSpeed: "0.6",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Loris",
    "link": "https://www.metatft.com/units/Beardy",
    "tier": "C",
    "placement": "4.60",
    "frequency": "108,347 13.3%",
    recommendedItems: [
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      },
      {
        itemName1: "Redemption",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redemption.png"
      }
    ],
    stats: {
      Health: "850/1530/2754",
      Mana: "50/90",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "50",
      MagicResist: "50",
      AttackSpeed: "0.65",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Ziggs",
    "link": "https://www.metatft.com/units/Ziggs",
    "tier": "C",
    "placement": "4.61",
    "frequency": "40,210 4.9%",
    recommendedItems: [
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Nashor's Tooth",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_leviathan.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Needlessly Large Rod",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_needlesslylargerod.png"
      }
    ],
    stats: {
      Health: "600/1080/1944",
      Mana: "15/60",
      AttackDamage: "35/53/79",
      AbilityPower: "100",
      Armor: "20",
      MagicResist: "20",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Rell",
    "link": "https://www.metatft.com/units/Rell",
    "tier": "C",
    "placement": "4.62",
    "frequency": "183,427 22.6%",
    recommendedItems: [
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      },
      {
        itemName1: "Thief's Gloves",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_thiefsgloves.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      }
    ],
    stats: {
      Health: "800/1440/2592",
      Mana: "40/90",
      AttackDamage: "60/90/135",
      AbilityPower: "100",
      Armor: "45",
      MagicResist: "45",
      AttackSpeed: "0.6",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Lux",
    "link": "https://www.metatft.com/units/Lux",
    "tier": "C",
    "placement": "4.63",
    "frequency": "40,196 4.9%",
    recommendedItems: [
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Nashor's Tooth",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_leviathan.png"
      },
      {
        itemName1: "Guinsoo's Rageblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guinsoosrageblade.png"
      }
    ],
    stats: {
      Health: "500/900/1620",
      Mana: "0/50",
      AttackDamage: "30/45/68",
      AbilityPower: "100",
      Armor: "20",
      MagicResist: "20",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Zyra",
    "link": "https://www.metatft.com/units/Zyra",
    "tier": "C",
    "placement": "4.65",
    "frequency": "42,040 5.2%",
    recommendedItems: [
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Nashor's Tooth",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_leviathan.png"
      },
      {
        itemName1: "Rabadon's Deathcap",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_rabadonsdeathcap.png"
      }
    ],
    stats: {
      Health: "500/900/1620",
      Mana: "10/60",
      AttackDamage: "30/45/68",
      AbilityPower: "100",
      Armor: "20",
      MagicResist: "20",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Renni",
    "link": "https://www.metatft.com/units/Chainsaw",
    "tier": "C",
    "placement": "4.66",
    "frequency": "78,034 9.6%",
    recommendedItems: [
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      },
      {
        itemName1: "Redemption",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redemption.png"
      }
    ],
    stats: {
      Health: "850/1530/2754",
      Mana: "40/100",
      AttackDamage: "55/83/124",
      AbilityPower: "100",
      Armor: "50",
      MagicResist: "50",
      AttackSpeed: "0.65",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Nunu & Willump",
    "link": "https://www.metatft.com/units/NunuWillump",
    "tier": "C",
    "placement": "4.68",
    "frequency": "153,696 18.9%",
    recommendedItems: [
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      },
      {
        itemName1: "Redemption",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redemption.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      }
    ],
    stats: {
      Health: "800/1440/2592",
      Mana: "60/125",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "50",
      MagicResist: "50",
      AttackSpeed: "0.6",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Morgana",
    "link": "https://www.metatft.com/units/Morgana",
    "tier": "C",
    "placement": "4.69",
    "frequency": "97,564 12.0%",
    recommendedItems: [
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Statikk Shiv",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_statikkshiv.png"
      },
      {
        itemName1: "Nashor's Tooth",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_leviathan.png"
      }
    ],
    stats: {
      Health: "500/900/1620",
      Mana: "0/40",
      AttackDamage: "30/45/68",
      AbilityPower: "100",
      Armor: "20",
      MagicResist: "20",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Swain",
    "link": "https://www.metatft.com/units/Swain",
    "tier": "C",
    "placement": "4.71",
    "frequency": "130,704 16.1%",
    recommendedItems: [
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      },
      {
        itemName1: "Redemption",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redemption.png"
      }
    ],
    stats: {
      Health: "650/1170/2106",
      Mana: "0/10",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "0",
      AttackSpeed: "0.5",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Camille",
    "link": "https://www.metatft.com/units/Camille",
    "tier": "C",
    "placement": "4.77",
    "frequency": "43,360 5.3%",
    recommendedItems: [
      {
        itemName1: "Hand Of Justice",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_unstableconcoction.png"
      },
      {
        itemName1: "Titan's Resolve",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_titansresolve.png"
      },
      {
        itemName1: "Bloodthirster",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bloodthirster.png"
      },
      {
        itemName1: "Sterak's Gage",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_steraksgage.png"
      },
      {
        itemName1: "Edge of Night",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guardianangel.png"
      }
    ],
    stats: {
      Health: "700/1260/2268",
      Mana: "0/25",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "45",
      MagicResist: "45",
      AttackSpeed: "0.75",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Renata Glasc",
    "link": "https://www.metatft.com/units/RenataGlasc",
    "tier": "C",
    "placement": "4.77",
    "frequency": "44,757 5.5%",
    recommendedItems: [
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Nashor's Tooth",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_leviathan.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Salvaged Revolver",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft13_crime_bronze_mageguard.png"
      }
    ],
    stats: {
      Health: "600/1080/1944",
      Mana: "20/80",
      AttackDamage: "35/53/79",
      AbilityPower: "100",
      Armor: "20",
      MagicResist: "20",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Scar",
    "link": "https://www.metatft.com/units/FlyGuy",
    "tier": "C",
    "placement": "4.78",
    "frequency": "64,977 8.0%",
    recommendedItems: [
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      },
      {
        itemName1: "Redemption",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redemption.png"
      }
    ],
    stats: {
      Health: "800/1440/2592",
      Mana: "80/170",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "50",
      MagicResist: "50",
      AttackSpeed: "0.65",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Vex",
    "link": "https://www.metatft.com/units/Vex",
    "tier": "D",
    "placement": "4.81",
    "frequency": "46,065 5.7%",
    recommendedItems: [
      {
        itemName1: "Jeweled Gauntlet",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_jeweledgauntlet.png"
      },
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Nashor's Tooth",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_leviathan.png"
      },
      {
        itemName1: "Rabadon's Deathcap",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_rabadonsdeathcap.png"
      }
    ],
    stats: {
      Health: "450/810/1458",
      Mana: "0/60",
      AttackDamage: "30/45/68",
      AbilityPower: "100",
      Armor: "15",
      MagicResist: "15",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "4"
    }
  },
  {
    name: "Singed",
    "link": "https://www.metatft.com/units/Singed",
    "tier": "D",
    "placement": "4.81",
    "frequency": "54,538 6.7%",
    recommendedItems: [
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Archangel's Staff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_archangelsstaff.png"
      },
      {
        itemName1: "Bloodthirster",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bloodthirster.png"
      },
      {
        itemName1: "Dragon's Claw",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_dragonsclaw.png"
      }
    ],
    stats: {
      Health: "650/1170/2106",
      Mana: "0/50",
      AttackDamage: "55/83/124",
      AbilityPower: "100",
      Armor: "40",
      MagicResist: "40",
      AttackSpeed: "0.6",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Trundle",
    "link": "https://www.metatft.com/units/Trundle",
    "tier": "D",
    "placement": "4.85",
    "frequency": "35,274 4.3%",
    recommendedItems: [
      {
        itemName1: "Giant's Belt",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_giantsbelt.png"
      },
      {
        itemName1: "Gargoyle Stoneplate",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_gargoylestoneplate.png"
      },
      {
        itemName1: "Warmog's Armor",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_warmogsarmor.png"
      },
      {
        itemName1: "Chain Vest",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_chainvest.png"
      },
      {
        itemName1: "Sunfire Cape",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_redbuff.png"
      }
    ],
    stats: {
      Health: "650/1170/2106",
      Mana: "30/90",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "40",
      MagicResist: "40",
      AttackSpeed: "0.65",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  },
  {
    name: "Maddie",
    "link": "https://www.metatft.com/units/Shooter",
    "tier": "D",
    "placement": "4.86",
    "frequency": "43,417 5.3%",
    recommendedItems: [
      {
        itemName1: "Infinity Edge",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_infinityedge.png"
      },
      {
        itemName1: "Guinsoo's Rageblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guinsoosrageblade.png"
      },
      {
        itemName1: "Spear of Shojin",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_spearofshojin.png"
      },
      {
        itemName1: "Last Whisper",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_lastwhisper.png"
      },
      {
        itemName1: "Deathblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_deathblade.png"
      }
    ],
    stats: {
      Health: "500/900/1620",
      Mana: "20/120",
      AttackDamage: "50/75/113",
      AbilityPower: "100",
      Armor: "15",
      MagicResist: "15",
      AttackSpeed: "0.7",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "6"
    }
  },
  {
    name: "Zeri",
    "link": "https://www.metatft.com/units/Zeri",
    "tier": "D",
    "placement": "4.87",
    "frequency": "45,684 5.6%",
    recommendedItems: [
      {
        itemName1: "Guinsoo's Rageblade",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guinsoosrageblade.png"
      },
      {
        itemName1: "Infinity Edge",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_infinityedge.png"
      },
      {
        itemName1: "Last Whisper",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_lastwhisper.png"
      },
      {
        itemName1: "Giant Slayer",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_madredsbloodrazor.png"
      },
      {
        itemName1: "Red Buff",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_rapidfirecannon.png"
      }
    ],
    stats: {
      Health: "600/1080/1944",
      Mana: "0/3",
      AttackDamage: "45/68/101",
      AbilityPower: "100",
      Armor: "20",
      MagicResist: "20",
      AttackSpeed: "0.75",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "6"
    }
  },
  {
    name: "Smeech",
    "link": "https://www.metatft.com/units/Gremlin",
    "tier": "D",
    "placement": "4.89",
    "frequency": "46,390 5.7%",
    recommendedItems: [
      {
        itemName1: "Bloodthirster",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_bloodthirster.png"
      },
      {
        itemName1: "Hand Of Justice",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_unstableconcoction.png"
      },
      {
        itemName1: "Titan's Resolve",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_titansresolve.png"
      },
      {
        itemName1: "Edge of Night",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_guardianangel.png"
      },
      {
        itemName1: "Sterak's Gage",
        itemImage1: "https://cdn.metatft.com/cdn-cgi/image/width=48,height=48,format=auto/https://cdn.metatft.com/file/metatft/items/tft_item_steraksgage.png"
      }
    ],
    stats: {
      Health: "800/1440/2592",
      Mana: "20/80",
      AttackDamage: "70/105/158",
      AbilityPower: "100",
      Armor: "50",
      MagicResist: "50",
      AttackSpeed: "0.8",
      CritChance: "25%",
      CritDamage: "140%",
      Range: "1"
    }
  }

];




const champions = [
  { name: "Aatrox", image: "aatrox.png", tier: 1 },
  { name: "Ahri", image: "ahri.png", tier: 1 },
  { name: "Akali", image: "Akali.png", tier: 2 },
  { name: "Akshan", image: "akshan.png", tier: 1 },
  { name: "Alistar", image: "alistar.png", tier: 1 },
  { name: "Ambessa", image: "Ambessa.png", tier: 4 },
  { name: "Amumu", image: "Amumu.png", tier: 1 },
  { name: "Anivia", image: "anivia.png", tier: 1 },
  { name: "Annie", image: "annie.png", tier: 1 },
  { name: "Aphelios", image: "aphelios.png", tier: 1 },
  { name: "Ashe", image: "ashe.png", tier: 1 },
  { name: "Aurelion Sol", image: "aurelion_sol.png", tier: 1 },
  { name: "Azir", image: "azir.png", tier: 1 },
  { name: "Bard", image: "bard.png", tier: 1 },
  { name: "Bel'Veth", image: "belveth.png", tier: 1 },
  { name: "Blitzcrank", image: "blitzcrank.png", tier: 3 },
  { name: "Brand", image: "brand.png", tier: 1 },
  { name: "Braum", image: "braum.png", tier: 1 },
  { name: "Caitlyn", image: "Caitlyn.png", tier: 5 },
  { name: "Camille", image: "Camille.png", tier: 2 },
  { name: "Cassiopeia", image: "Cassiopeia.png", tier: 3 },
  { name: "Cho'Gath", image: "chogath.png", tier: 1 },
  { name: "Corki", image: "Corki.png", tier: 4 },
  { name: "Darius", image: "Darius.png", tier: 1 },
  { name: "Diana", image: "diana.png", tier: 1 },
  { name: "Dr. Mundo", image: "DrMundo.png", tier: 4 },
  { name: "Draven", image: "Draven.png", tier: 1 },
  { name: "Ekko", image: "Ekko.png", tier: 4 },
  { name: "Elise", image: "Elise.png", tier: 4 },
  { name: "Evelynn", image: "evelynn.png", tier: 1 },
  { name: "Ezreal", image: "Ezreal.png", tier: 3 },
  { name: "Fiddlesticks", image: "fiddlesticks.png", tier: 1 },
  { name: "Fiora", image: "fiora.png", tier: 1 },
  { name: "Fizz", image: "fizz.png", tier: 1 },
  { name: "Galio", image: "galio.png", tier: 1 },
  { name: "Gangplank", image: "Gangplank.png", tier: 3 },
  { name: "Garen", image: "Garen.png", tier: 4 },
  { name: "Gnar", image: "gnar.png", tier: 1 },
  { name: "Gragas", image: "gragas.png", tier: 1 },
  { name: "Graves", image: "graves.png", tier: 1 },
  { name: "Gwen", image: "gwen.png", tier: 1 },
  { name: "Hecarim", image: "hecarim.png", tier: 1 },
  { name: "Heimerdinger", image: "Heimerdinger.png", tier: 4 },
  { name: "Illaoi", image: "Illaoi.png", tier: 4 },
  { name: "Irelia", image: "Irelia.png", tier: 1 },
  { name: "Ivern", image: "ivern.png", tier: 1 },
  { name: "Janna", image: "janna.png", tier: 1 },
  { name: "Jarvan IV", image: "jarvan_iv.png", tier: 1 },
  { name: "Jax", image: "jax.png", tier: 1 },
  { name: "Jayce", image: "Jayce.png", tier: 5 },
  { name: "Jhin", image: "jhin.png", tier: 1 },
  { name: "Jinx", image: "Jinx.png", tier: 5 },
  { name: "Kai'Sa", image: "kaisa.png", tier: 1 },
  { name: "Kalista", image: "kalista.png", tier: 1 },
  { name: "Karma", image: "karma.png", tier: 1 },
  { name: "Karthus", image: "karthus.png", tier: 1 },
  { name: "Kassadin", image: "kassadin.png", tier: 1 },
  { name: "Katarina", image: "katarina.png", tier: 1 },
  { name: "Kayle", image: "kayle.png", tier: 1 },
  { name: "Kayn", image: "kayn.png", tier: 1 },
  { name: "Kennen", image: "kennen.png", tier: 1 },
  { name: "Kha'Zix", image: "khazix.png", tier: 1 },
  { name: "Kindred", image: "kindred.png", tier: 1 },
  { name: "Kled", image: "kled.png", tier: 1 },
  { name: "Kog'Maw", image: "Kogmaw.png", tier: 3 },
  { name: "K'Sante", image: "ksante.png", tier: 1 },
  { name: "LeBlanc", image: "Leblanc.png", tier: 5 },
  { name: "Lee Sin", image: "leesin.png", tier: 1 },
  { name: "Leona", image: "Leona.png", tier: 2 },
  { name: "Lillia", image: "lillia.png", tier: 1 },
  { name: "Lissandra", image: "lissandra.png", tier: 1 },
  { name: "Loris", image: "Loris.png", tier: 3 },
  { name: "Lucian", image: "lucian.png", tier: 1 },
  { name: "Lulu", image: "lulu.png", tier: 1 },
  { name: "Lux", image: "Lux.png", tier: 1 },
  { name: "Maddie", image: "Maddie.png", tier: 1 },
  { name: "Malphite", image: "malphite.png", tier: 1 },
  { name: "Malzahar", image: "Malzahar.png", tier: 5 },
  { name: "Maokai", image: "maokai.png", tier: 1 },
  { name: "Master Yi", image: "master_yi.png", tier: 1 },
  { name: "Mel", image: "mel.png", tier: 6 },
  { name: "Milio", image: "milio.png", tier: 1 },
  { name: "Miss Fortune", image: "miss_fortune.png", tier: 1 },
  { name: "Mordekaiser", image: "Mordekaiser.png", tier: 5 },
  { name: "Morgana", image: "Morgana.png", tier: 1 },
  { name: "Nami", image: "Nami.png", tier: 3 },
  { name: "Nasus", image: "nasus.png", tier: 1 },
  { name: "Nautilus", image: "nautilus.png", tier: 1 },
  { name: "Neeko", image: "neeko.png", tier: 1 },
  { name: "Nidalee", image: "nidalee.png", tier: 1 },
  { name: "Nilah", image: "nilah.png", tier: 1 },
  { name: "Nocturne", image: "Nocturne.png", tier: 2 },
  { name: "Nunu & Willump", image: "Nunu.png", tier: 3 },
  { name: "Powder", image: "Powder.png", tier: 1},
  { name: "Olaf", image: "olaf.png", tier: 1 },
  { name: "Orianna", image: "orianna.png", tier: 1 },
  { name: "Ornn", image: "ornn.png", tier: 1 },
  { name: "Pantheon", image: "pantheon.png", tier: 1 },
  { name: "Poppy", image: "poppy.png", tier: 1 },
  { name: "Pyke", image: "pyke.png", tier: 1 },
  { name: "Qiyana", image: "qiyana.png", tier: 1 },
  { name: "Quinn", image: "quinn.png", tier: 1 },
  { name: "Rakan", image: "rakan.png", tier: 1 },
  { name: "Rammus", image: "rammus.png", tier: 1 },
  { name: "Rek'Sai", image: "reksai.png", tier: 1 },
  { name: "Rell", image: "Rell.png", tier: 2 },
  { name: "Renata Glasc", image: "Renata.png", tier: 2 },
  { name: "Renni", image: "Renni.png", tier: 3 },
  { name: "Renekton", image: "renekton.png", tier: 1 },
  { name: "Rengar", image: "rengar.png", tier: 1 },
  { name: "Riven", image: "riven.png", tier: 1 },
  { name: "Rumble", image: "Rumble.png", tier: 5 },
  { name: "Ryze", image: "ryze.png", tier: 1 },
  { name: "Samira", image: "samira.png", tier: 1 },
  { name: "Scar", image: "Scar.png", tier: 3 },
  { name: "Sejuani", image: "sejuani.png", tier: 1 },
  { name: "Senna", image: "senna.png", tier: 1 },
  { name: "Seraphine", image: "seraphine.png", tier: 1 },
  { name: "Sett", image: "Sett.png", tier: 2 },
  { name: "Sevika", image: "Sevika.png", tier: 5 },
  { name: "Shaco", image: "shaco.png", tier: 1 },
  { name: "Shen", image: "shen.png", tier: 1 },
  { name: "Shyvana", image: "shyvana.png", tier: 1 },
  { name: "Silco", image: "Silco.png", tier: 4 },
  { name: "Singed", image: "Singed.png", tier: 1 },
  { name: "Smeech", image: "Smeech.png", tier: 3 },
  { name: "Sion", image: "sion.png", tier: 1 },
  { name: "Sivir", image: "sivir.png", tier: 1 },
  { name: "Skarner", image: "skarner.png", tier: 1 },
  { name: "Sona", image: "sona.png", tier: 1 },
  { name: "Soraka", image: "soraka.png", tier: 1 },
  { name: "Steb", image: "Steb.png", tier: 1 },
  { name: "Swain", image: "Swain.png", tier: 3 },
  { name: "Sylas", image: "sylas.png", tier: 1 },
  { name: "Syndra", image: "syndra.png", tier: 1 },
  { name: "Tahm Kench", image: "tahm_kench.png", tier: 1 },
  { name: "Taliyah", image: "taliyah.png", tier: 1 },
  { name: "Talon", image: "talon.png", tier: 1 },
  { name: "Taric", image: "taric.png", tier: 1 },
  { name: "Teemo", image: "teemo.png", tier: 1 },
  { name: "Thresh", image: "thresh.png", tier: 1 },
  { name: "Tristana", image: "Tristana.png", tier: 2 },
  { name: "Trundle", image: "Trundle.png", tier: 1 },
  { name: "Tryndamere", image: "tryndamere.png", tier: 1 },
  { name: "Twisted Fate", image: "TwistedFate.png", tier: 3 },
  { name: "Twitch", image: "Twitch.png", tier: 4 },
  { name: "Udyr", image: "udyr.png", tier: 1 },
  { name: "Urgot", image: "Urgot.png", tier: 2 },
  { name: "Vander", image: "Vander.png", tier: 2 },
  { name: "Varus", image: "varus.png", tier: 1 },
  { name: "Vayne", image: "vayne.png", tier: 1 },
  { name: "Veigar", image: "veigar.png", tier: 1 },
  { name: "Vel'Koz", image: "velkoz.png", tier: 1 },
  { name: "Vex", image: "Vex.png", tier: 1 },
  { name: "Vi", image: "Vi.png", tier: 4 },
  { name: "Violet", image: "Violet.png", tier: 1 },
  { name: "Viego", image: "viego.png", tier: 1 },
  { name: "Viktor", image: "Viktor.png", tier: 6 },
  { name: "Vladimir", image: "Vladimir.png", tier: 2 },
  { name: "Volibear", image: "volibear.png", tier: 1 },
  { name: "Warwick", image: "Warwick.png", tier: 6 },
  { name: "Wukong", image: "wukong.png", tier: 1 },
  { name: "Xayah", image: "xayah.png", tier: 1 },
  { name: "Xerath", image: "xerath.png", tier: 1 },
  { name: "Xin Zhao", image: "xin_zhao.png", tier: 1 },
  { name: "Yasuo", image: "yasuo.png", tier: 1 },
  { name: "Yone", image: "yone.png", tier: 1 },
  { name: "Yorick", image: "yorick.png", tier: 1 },
  { name: "Yuumi", image: "yuumi.png", tier: 1 },
  { name: "Zac", image: "zac.png", tier: 1 },
  { name: "Zed", image: "zed.png", tier: 1 },
  { name: "Zeri", image: "Zeri.png", tier: 2 },
  { name: "Ziggs", image: "Ziggs.png", tier: 2 },
  { name: "Zilean", image: "zilean.png", tier: 1 },
  { name: "Zoe", image: "Zoe.png", tier: 4 },
  { name: "Zyra", image: "Zyra.png", tier: 1 }
];

// Set 13 Champions
const set13Champions = [
  "Akali", "Ambessa", "Amumu", "Blitzcrank", "Caitlyn", "Camille", "Cassiopeia", "Corki", "Darius", "Dr Mundo",
  "Draven", "Ekko", "Elise", "Ezreal", "Gangplank", "Garen", "Heimerdinger", "Illaoi", "Irelia", "Jayce", "Jinx",
  "Kog'Maw", "LeBlanc", "Leona", "Loris", "Lux", "Maddie", "Malzahar", "Mordekaiser", "Morgana", "Nami", "Nocturne",
  "Nunu & Willump", "Powder", "Rell", "Renata Glasc", "Renni", "Rumble", "Scar", "Sett", "Sevika", "Silco", "Singed",
  "Smeech", "Steb", "Swain", "Tristana", "Trundle", "Twisted Fate", "Twitch", "Urgot", "Vander", "Vex", "Vi", "Violet",
  "Vladimir", "Zeri", "Ziggs", "Zoe", "Zyra"
];

// Maybe add API here for adding champ names based on each new set?
// Filter champions based on search query
function filterChampions() {
  const query = searchInput.value.toLowerCase();
  dropdown.innerHTML = ""; // Clear previous results

  const filtered = champions.filter(
    (c) => set13Champions.includes(c.name) && c.name.toLowerCase().includes(query)
  );

  // Populate dropdown with filtered results
  filtered.forEach((champion) => {
    const option = document.createElement("div");
    option.textContent = champion.name;
    option.onclick = () => selectChampion(champion);
    option.style.cursor = "pointer";
    option.style.padding = "5px";
    dropdown.appendChild(option);
  });

  dropdown.style.display = filtered.length > 0 ? "block" : "none";
}


// Handle champion selection
function selectChampion(champion) {
  const championImagePath = "images/championIcons/";
  championImage.src = championImagePath + champion.image;
  championImage.style.display = "block";

  const tierColors = {
    1: "#afafaf",
    2: "#00c769",
    3: "#1167bf",
    4: "#ff43c2",
    5: "#ff8d23"
  };

  championCircle.style.borderColor = tierColors[champion.tier] || "#555";

  searchInput.value = champion.name;
  desiredChampionTier = champion.tier;

  // Adjust the slider maximum based on the champion tier
  const maxValues = {
    1: 30,
    2: 25,
    3: 18,
    4: 10,
    5: 9
  };
  const maxForTier = maxValues[champion.tier] || 30; // Default to 30 if tier is undefined
  const desiredChampionsSlider = document.getElementById("championCopiesInGame");
  desiredChampionsSlider.max = maxForTier;


  //stats
  const selectedChampionStats = championStats.find((stat) => stat.name === champion.name);
  
  if (selectedChampionStats) {
    document.querySelector("#stats .unit-stats-grid").innerHTML = `
      <div class="unit-stat-item">
        <img src="images/championStatImages/Health.png" alt="Health" class="stat-icon">
        <span>Health</span>
        <span class="stat-value">${selectedChampionStats.stats.Health}</span>
      </div>
      <div class="unit-stat-item">
        <img src="images/championStatImages/Mana.png" alt="Mana" class="stat-icon">
        <span>Mana</span>
        <span class="stat-value">${selectedChampionStats.stats.Mana}</span>
      </div>
      <div class="unit-stat-item">
        <img src="images/championStatImages/AD.png" alt="Attack Damage" class="stat-icon">
        <span>Attack Damage</span>
        <span class="stat-value">${selectedChampionStats.stats.AttackDamage}</span>
      </div>
      <div class="unit-stat-item">
        <img src="images/championStatImages/Armor.png" alt="Armor" class="stat-icon">
        <span>Armor</span>
        <span class="stat-value">${selectedChampionStats.stats.Armor}</span>
      </div>
      <div class="unit-stat-item">
        <img src="images/championStatImages/MagicResist.png" alt="Magic Resist" class="stat-icon">
        <span>Magic Resist</span>
        <span class="stat-value">${selectedChampionStats.stats.MagicResist}</span>
      </div>
      <div class="unit-stat-item">
        <img src="images/championStatImages/AS.png" alt="Attack Speed" class="stat-icon">
        <span>Attack Speed</span>
        <span class="stat-value">${selectedChampionStats.stats.AttackSpeed}</span>
      </div>
       <div class="unit-stat-item">
        <img src="images/championStatImages/AP.png" alt="AbilityPower" class="stat-icon">
        <span>Ability Power</span>
        <span class="stat-value">${selectedChampionStats.stats.AbilityPower}</span>
      </div>
      <div class="unit-stat-item">
        <img src="images/championStatImages/CritChance.png" alt="CritChance" class="stat-icon">
        <span>Crit Chance</span>
        <span class="stat-value">${selectedChampionStats.stats.CritChance}</span>
      </div>
      <div class="unit-stat-item">
        <img src="images/championStatImages/Range.png" alt="Range" class="stat-icon">
        <span>Range</span>
        <span class="stat-value">${selectedChampionStats.stats.Range}</span>
      </div>
      <div class="unit-stat-item">
        <img src="images/championStatImages/CritDamage.png" alt="CritDamage" class="stat-icon">
        <span>Crit Damage</span>
        <span class="stat-value">${selectedChampionStats.stats.CritDamage}</span>
      </div>


    `;
  }

// Populate Items Tab
// Function to populate items for a selected champion
function populateChampionItems(championName) {
  const itemsTabContent = document.getElementById("items");

  // Find the champion's data from the dataset
  const championData = championBISItems.find(champion => champion.champion === championName);

  if (championData && championData.top5Builds.length > 0) {
    // Generate HTML for the items
    const buildsHTML = championData.top5Builds
      .map((build, index) => `
        <div class="build">
          <h4>Build ${index + 1}</h4>
          <div class="items-row">
            ${build.items.map(item => `
              <div class="item">
                <img src="/path/to/${item.replace(/\s+/g, "-").toLowerCase()}.png" alt="${item}" class="item-icon">
                <span>${item}</span>
              </div>
            `).join("")}
          </div>
          <div class="build-info">
            
          </div>
        </div>
      `)
      .join("");

    // Insert the content into the items tab
    itemsTabContent.innerHTML = `
      <div class="items-section">
        <h3>Recommended Builds for ${championData.champion}</h3>
        <div class="items-grid">${buildsHTML}</div>
      </div>
    `;
  } else {
    // Display a message if no builds are available
    itemsTabContent.innerHTML = `
      <h3>Recommended Items</h3>
      <p>No recommended builds for this champion.</p>
    `;
  }
}

// Example usage
populateChampionItems(champion.name); 



  //Anomalies
  const selectedAnomalies = championAnomalies.find(champ => champ.name === champion.name);

  const anomaliesTabContent = document.getElementById("anomalies");

  if (selectedAnomalies) {
    const anomaliesHTML = selectedAnomalies.anomalies.map(anomaly => `
      <div class="anomaly-item">
        <div class="anomaly-content">
          <div class="anomaly-category">${anomaly.category}</div>
          <div class="anomaly-description">Anomaly: ${anomaly.anomaly}</div>
        </div>
      </div>
    `).join("");

    anomaliesTabContent.innerHTML = `
  <div class="anomalies-section">
    
    <div class="anomalies-list">
      ${anomaliesHTML}
    </div>
  </div>
`;
  } else {
    anomaliesTabContent.innerHTML = `
      <h3>Anomalies</h3>
      <p>No anomalies available for the selected champion.</p>
    `;
  }

  // Make sure the anomalies tab is opened when a champion is selected
  openTab(event, 'anomalies'); // Assuming this function handles tab switching





  //Abilities
  const selectedChampion = championAbilities.find(champ => champ.name === champion.name);

  const abilityTabContent = document.getElementById("ability");

  if (selectedChampion) {
    const abilityHTML = `
      <div class="ability">
        <img src="${selectedChampion.ability.icon}" alt="${selectedChampion.ability.name}" class="ability-icon">
        <h4>${selectedChampion.ability.name}</h4>
        <p>${selectedChampion.ability.AbilityDescription}</p>
      </div>
    
    `;

    abilityTabContent.innerHTML = `
      <h3>${selectedChampion.name}'s Ability</h3>
      ${abilityHTML}
    `;
  } else {
    abilityTabContent.innerHTML = `
      <h3>Ability</h3>
      <p>No ability details available for the selected champion.</p>
    `;
  }

  openTab(event, 'ability'); // Ensure the ability tab is opened when a champion is selected







  // Ensure the current slider value is within the new max
  if (parseInt(desiredChampionsSlider.value, 10) > maxForTier) {
    desiredChampionsSlider.value = maxForTier;
    document.getElementById("championCopiesInGame").textContent = maxForTier;
    championCopiesInGame = maxForTier; // Update global variable
  }

  const playerLevel = parseInt(document.getElementById("levelSlider").value, 10);
  const numShops = parseInt(document.getElementById("numShops").value, 10);
  const championCopiesInGame = parseInt(document.getElementById("championCopiesInGame").value, 10);
  updateChart(playerLevel, numShops, championCopiesInGame);

  dropdown.style.display = "none";
}

// Hide dropdown if user clicks outside of it
document.addEventListener("click", event => {
  if (!dropdown.contains(event.target) && event.target !== searchInput) {
    dropdown.style.display = "none";
  }
});

// Event listener for search input
searchInput.addEventListener("input", filterChampions);

 // Tab system script
 function openTab(evt, tabId) {
  // Hide all tab contents
  const tabContents = document.querySelectorAll(".tab-content");
  tabContents.forEach(content => content.style.display = "none");

  // Remove "active" class from all buttons
  const tabButtons = document.querySelectorAll(".tab-button");
  tabButtons.forEach(button => button.classList.remove("active"));

  // Show the selected tab and mark the button as active
  document.getElementById(tabId).style.display = "block";
  evt.currentTarget.classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
const defaultTabButton = document.querySelector(".tab-button.active");
if (defaultTabButton) {
  defaultTabButton.click(); // Simulate a click on the default tab
}
});




// Function to update the comp display based on search input
function updateCompDisplay(query) {
  const lowerCaseQuery = query.toLowerCase();

  // Filter comps based on the search query
  const filteredComps = championComp.map((comp) => {
    // Check if any champion in the comp matches the query
    const matches = comp.championsComp.some((champ) =>
      champ.name.toLowerCase().includes(lowerCaseQuery)
    );
    return { ...comp, matches };
  });

  // Sort comps to bring matching ones to the top
  const sortedComps = filteredComps.sort((a, b) => b.matches - a.matches);

  // Clear the current comp display
  const compContainer = document.getElementById("compContainer");
  compContainer.innerHTML = "";

  // Render the sorted comps
  sortedComps.forEach((comp) => {
    // Skip comps that do not match the query
    if (!comp.matches && lowerCaseQuery) return;

    const compDiv = document.createElement("div");
    compDiv.classList.add("comp");

    // Add the comp name
    const compName = document.createElement("h3");
    compName.textContent = comp.compName;
    compDiv.appendChild(compName);

    // Add the champions in the comp
    const champList = document.createElement("div");
    champList.classList.add("champion-list");

    comp.championsComp.forEach((champ) => {
      const champDiv = document.createElement("div");
      champDiv.classList.add("champion");

      // Highlight the matching champion name in the search results
      const highlightedName = champ.name
        .replace(
          new RegExp(`(${lowerCaseQuery})`, "gi"),
          (match) => `<span class="highlight">${match}</span>`
        );

      champDiv.innerHTML = highlightedName;
      champList.appendChild(champDiv);
    });

    compDiv.appendChild(champList);
    compContainer.appendChild(compDiv);
  });

  // Show a message if no comps match the query
  if (!sortedComps.some((comp) => comp.matches)) {
    const noResultMessage = document.createElement("p");
    noResultMessage.textContent = "No compositions match your search.";
    noResultMessage.classList.add("no-results");
    compContainer.appendChild(noResultMessage);
  }
}

// Attach the search input listener
searchInput.addEventListener("input", () => {
  const query = searchInput.value;
  updateCompDisplay(query);
});

// Initialize the comp display with all comps on page load
document.addEventListener("DOMContentLoaded", () => {
  updateCompDisplay(""); // Pass an empty query to display all comps
});