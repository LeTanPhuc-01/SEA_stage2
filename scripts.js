/**
 * Data Catalog Project Starter Code - SEA Stage 2
 * This is my catalog to help me find anime movies to watch. 
 */
let animeData = [];
let currentCorrectAnime = null;

// Filter/Controls/Sort variables
const searchBar = document.getElementById("search-bar");
const studioFilter = document.getElementById("studio-filter");
const genreContainer = document.getElementById("genre-checkbox-container");
const genreToggle = document.getElementById("genre-toggle");
const genreMenu = document.getElementById("genre-menu");
const yearFilter = document.getElementById("year-filter");
const sortSelect = document.getElementById("sort-select");
const surpriseBtn = document.getElementById("surprise-btn");
const resetBtn = document.getElementById("reset-btn");

// Card variables
const cardContainer = document.getElementById("card-container");
const templateCard = document.getElementById("template-card");

// Trivia Modal variables
const openTriviaBtn = document.getElementById("open-trivia-btn");
const closeModalBtn = document.getElementById("close-modal-btn");
const triviaModal = document.getElementById("trivia-modal");

// Trivia Logic variables
const startTriviaBtn = document.getElementById("start-trivia-btn");
const triviaQuestion = document.getElementById("trivia-question");
const triviaFeedback = document.getElementById("trivia-feedback");
const triviaOptions = [
  document.getElementById("btn-a"),
  document.getElementById("btn-b"),
  document.getElementById("btn-c"),
  document.getElementById("btn-d")
];

fetch("../assets/anime_data.json")
  .then(res => res.json())
  .then(data => {
    animeData = [...data];
    showCards(animeData);
    populateDropdowns(animeData);
  });

// This function adds cards the page to display the data in the array
function showCards(animes) {
  // Clear the card container, ready for new cards
  cardContainer.innerHTML = "";
  animes.forEach(anime => {
    const nextCard = templateCard.cloneNode(true); // Copy the template card
    editCardContent(nextCard, anime);
    cardContainer.appendChild(nextCard);
  });
}

// Populate card 
function editCardContent(card, anime) {
  card.style.display = "flex";

  const cardHeader = card.querySelector(".card-title-target");
  cardHeader.textContent = anime.title;

  const cardStudio = card.querySelector(".card-studio-target");
  cardStudio.textContent = anime.studio;

  const cardImage = card.querySelector(".card-img-target");
  cardImage.src = anime.posterURL;
  cardImage.alt = anime.title + " Poster";

  const cardSynopsis = card.querySelector(".card-synopsis-target");
  cardSynopsis.textContent = anime.synopsis;  

  const cardScore = card.querySelector(".card-score-target");
  cardScore.textContent = "⭐ " + anime.score + " / 10";

  const cardYear = card.querySelector(".card-year-target");
  cardYear.textContent = anime.releaseYear;

  // Loop through the genres array
  const badgesContainer = card.querySelector(".card-genres-target");
  badgesContainer.innerHTML = ""; // Clear out the placeholder HTML

  anime.genres.forEach(genre => {
    const span = document.createElement("span");
    span.className = "genre-badge";
    span.textContent = genre;
    badgesContainer.appendChild(span);
  });

  // You can use console.log to help you debug!
  // View the output by right clicking on your website,
  // select "Inspect", then click on the "Console" tab
  console.log("new card:", anime.title, "- html: ", card);
}

// Populate Sort options
function populateDropdowns(animes) {
  // Using sets for unique values
  const uniqueStudios = new Set();
  const uniqueGenres = new Set();
  const uniqueYears = new Set();

  animes.forEach(anime => {
    uniqueStudios.add(anime.studio);
    uniqueYears.add(anime.releaseYear);
    anime.genres.forEach(genre => uniqueGenres.add(genre));
  });
  
  // Sort lexicographically is fine for studios and genres
  const sortedStudios = [...uniqueStudios].sort();
  const sortedGenres = [...uniqueGenres].sort();

  // Sort numbers descending
  // Because the factory .sort() sorts in a lexicographical order, we need to use a custom sort function
  const sortedYears = [...uniqueYears].sort((a, b) => b - a);

  genreContainer.innerHTML = "";
  sortedGenres.forEach(genre => {
    const label = document.createElement("label");
    label.className = "checkbox-label";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = genre;
    checkbox.className = "genre-checkbox"; // Class used to easily grab them later

    // Append checkbox and text to the label, then append label to container
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(genre));
    genreContainer.appendChild(label);
  });

  sortedStudios.forEach(studio => {
    const option = document.createElement("option");
    option.value = studio;
    option.textContent = studio;
    studioFilter.appendChild(option);
  });

  sortedYears.forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearFilter.appendChild(option);
  });
}

// Feature 1: Search with filter including studio, genre, and year
function searchFilter() {
  const keyword = searchBar.value.toLowerCase();
  const studio = studioFilter.value;
  const year = yearFilter.value;
  const genres = Array.from(genreContainer.querySelectorAll(".genre-checkbox:checked")).map(cb => cb.value);

  const params = new URLSearchParams();
  if (keyword) params.set("keyword", keyword);
  if (studio != "all") params.set("studio", studio);
  if (year != "all") params.set("year", year);
  genres.forEach(g => params.append('genre', g));

  // Uses URL object to pass in our params
  const newUrl = new URL(window.location); 
  newUrl.search = params;
  // Updates the URL in the browser without reloading the page
  window.history.replaceState(null, '', newUrl);

  // Filter the data based on parameters
  const filteredAnimes = animeData.filter(anime => {
    // Some anime have multiple titles, so we check both title and synopsis
    const matchesKeyword = anime.title.toLowerCase().includes(keyword) || anime.synopsis.toLowerCase().includes(keyword);
    const matchesStudio = studio === "all" || anime.studio === studio;
    const matchesYear = year === "all" || anime.releaseYear === parseInt(year);
    const matchesGenres = genres.length === 0 || genres.some(g => anime.genres.includes(g));
    return matchesKeyword && matchesStudio && matchesYear && matchesGenres;
  }); 

  const sortValue = sortSelect.value;
  sortAnimes(filteredAnimes, sortValue);

  // Sort the filtered animes such that the ones with more matched genres rank first
  if(filteredAnimes.length > 1 && genres.length > 0) {
    filteredAnimes.sort((a, b) => {
      const aMatchedGenres = a.genres.filter(g => genres.includes(g)).length;
      const bMatchedGenres = b.genres.filter(g => genres.includes(g)).length;
      return bMatchedGenres - aMatchedGenres;
    } );
  }
  showCards(filteredAnimes);
}
// Helper sort function, can be used with pre-existing filtered Animes
function sortAnimes(arrayToSort, sortValue){
  switch (sortValue) {
    case "score-desc":
      arrayToSort.sort((a, b) => b.score - a.score);
      break;
    case "year-desc":
      arrayToSort.sort((a, b) => b.releaseYear - a.releaseYear);
      break;
    case "year-asc":
      arrayToSort.sort((a, b) => a.releaseYear - b.releaseYear);
      break;
    case "title":
      arrayToSort.sort((a, b) => a.title > b.title ? 1 : -1);
      break;
    default:
      throw new Error("Invalid sort value");
  }
}
// Give you one random anime from the list
function surpriseMe(animes) {
 const random = Math.floor(Math.random() * animes.length);
 resetBtn.click();
 showCards([animes[random]]);
}
// Feature 2: Anime Trivia
function generateTriviaQuestion() {
  // Choose a random anime using random index
  const correctIndex = Math.floor(Math.random() * animeData.length);
  currentCorrectAnime = animeData[correctIndex];

  // Choose a random category
  const categories = ["synopsis", "studio", "year", "score"];
  const selectedCategory = categories[Math.floor(Math.random() * categories.length)];

  // Filter out any animes that share the exact property we are testing
  let validWrongPool = animeData.filter(anime => {
    if (anime.title === currentCorrectAnime.title) return false;

    // Apply constraints based on the specific question being asked
    switch (selectedCategory) {
      case "studio":
        return anime.studio !== currentCorrectAnime.studio;
      case "year":
        return anime.releaseYear !== currentCorrectAnime.releaseYear;
      case "score":
        return anime.score !== currentCorrectAnime.score;
      default:
        return true;
    }
  });

  // Fallback: In case the anime dataset is too small, we choose a different wrong answer
  if (validWrongPool.length < 3) {
      validWrongPool = animeData.filter(anime => anime.title !== currentCorrectAnime.title);
  }

  // Shuffle the safe pool and grab 3 guaranteed "wrong" answers
  const shuffledWrongPool = validWrongPool.sort(() => 0.5 - Math.random());
  const wrongOptions = shuffledWrongPool.slice(0, 3);

  // Combine the 1 correct answer with the 3 wrong answers, and mix them
  const finalOptions = [currentCorrectAnime, ...wrongOptions].sort(() => 0.5 - Math.random());

  // Update the UI based on the selected category
  switch (selectedCategory) {
    case "synopsis":
      triviaQuestion.textContent = `Which anime has this synopsis: "${currentCorrectAnime.synopsis}"`;
      break;
    case "studio":
      triviaQuestion.textContent = `Which of these animes was produced by the studio: ${currentCorrectAnime.studio}?`;
      break;
    case "year":
      triviaQuestion.textContent = `Which of these animes was released in the year: ${currentCorrectAnime.releaseYear}?`;
      break;
    case "score":
      triviaQuestion.textContent = `Which of these animes has a score of: ${currentCorrectAnime.score}/10?`;
      break;
    default:
      throw new Error("Invalid category");
  }

  triviaFeedback.textContent = ""; // Clear old feedback

  // Populate the 4 buttons with our safely generated options
  triviaOptions.forEach((btn, index) => {
      btn.textContent = finalOptions[index].title;
      btn.disabled = false; 
      btn.style.backgroundColor = "rgba(255, 255, 255, 0.2)"; 
      btn.style.color = "white";
      
      btn.onclick = () => checkTriviaAnswer(finalOptions[index].title, btn);
  });

  startTriviaBtn.textContent = "Next Question";
}

// Helper function to check Trivia answer
function checkTriviaAnswer(selectedTitle, clickedBtn) {
  // Disable buttons to lock in answer
  triviaOptions.forEach(btn => btn.disabled = true);

  // Check answer with currentCorrectAnime
  if (selectedTitle === currentCorrectAnime.title) {
    triviaFeedback.textContent = "Correct! 🎉";
    clickedBtn.style.backgroundColor = "#2ecc71"; // Turn button Green
  } else {
    triviaFeedback.textContent = `Incorrect! The right answer was ${currentCorrectAnime.title}.`;
    clickedBtn.style.backgroundColor = "#e74c3c"; // Turn clicked button Red
    
    // Show correct answer
    triviaOptions.forEach(btn => {
      if (btn.textContent === currentCorrectAnime.title) {
        btn.style.backgroundColor = "#2ecc71";
      }
    });
  }
}


// Global event listener for read more buttons of card (event delegation)
document.addEventListener('click', e => {
  if(e.target.matches(".read-more-btn")){
    const readMoreBtn = e.target;
    // Find the closest container, then select the synopsis from it
    const synopsisContainer = readMoreBtn.closest('.synopsis-container');
    const cardSynopsis = synopsisContainer.querySelector('.card-synopsis-target');
    
    cardSynopsis.classList.toggle("expanded");
    // Synopsis expand and collapse based on Read More state
    if (cardSynopsis.classList.contains("expanded")) {
      readMoreBtn.textContent = "Read Less";
    } else {
      readMoreBtn.textContent = "Read More";
    }
  }
});

genreToggle.addEventListener("click", () => {
  genreMenu.classList.toggle("open");
});

document.addEventListener("click", (e) => {
  if (!genreToggle.contains(e.target) && !genreMenu.contains(e.target)){
    genreMenu.classList.remove("open");
  }
});

// Event listeners for search and filter
sortSelect.addEventListener('change', searchFilter);
searchBar.addEventListener('input', searchFilter);
studioFilter.addEventListener('change', searchFilter);
yearFilter.addEventListener('change', searchFilter);
genreContainer.addEventListener('change', (e) => {
  if (e.target.classList.contains('genre-checkbox')) {
    searchFilter();
  }
});

resetBtn.addEventListener('click', () => {
  sortSelect.value = "default";
  searchBar.value = "";
  studioFilter.value = "all";
  yearFilter.value = "all";
  genreContainer.querySelectorAll('.genre-checkbox').forEach(cb => cb.checked = false);
  searchFilter();
});

surpriseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    surpriseMe(animeData);
});

// Trivia Game Event Listeners
openTriviaBtn.addEventListener('click', () => {
  triviaModal.style.display = "flex";
  // Generate new question
  if(!currentCorrectAnime) {
    generateTriviaQuestion();
  }
});

closeModalBtn.addEventListener("click", () => {
  triviaModal.style.display = "none";
});

// Close Modal if clicking the dark background overlay
window.addEventListener("click", (event) => {
  if (event.target === triviaModal) {
    triviaModal.style.display = "none";
  }
});

// Start / Next Question Button
startTriviaBtn.addEventListener("click", generateTriviaQuestion);