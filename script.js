// Content
/*
1. NAVIGATION JS
2. GET AND RENDER MOVIE CONFIGURATION
3. SEARCH BAR CONFIGURATION
4. MOVIE DETAILS CONFIGURATION
5. WATCHLIST EDITOR
*/

// NAVIGATION JS
let lastScrollTop = 0;
const header = document.getElementById('header');
const navBottom = document.getElementById("nav-bottom");
let scrollTimer = null;
let isScrollingDown = false;

// Initialize the scroll threshold based on device height
const scrollThreshold = window.innerHeight * 0.05; // 5% of viewport height

window.addEventListener("scroll", function() {
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    // Determine if scrolling direction has changed significantly
    if (Math.abs(currentScroll - lastScrollTop) < scrollThreshold) {
        return; // Ignore small scroll movements
    }
    
    // Clear previous timeout
    if (scrollTimer !== null) {
        clearTimeout(scrollTimer);
    }
    
    if (currentScroll > lastScrollTop) {
        // Scrolling DOWN: hide header and footer
        if (!isScrollingDown) {
            isScrollingDown = true;
            header.style.transform = "translateY(-100%)";
            header.style.opacity = "0";
            navBottom.style.transform = "translateY(100%)";
            navBottom.style.opacity = "0";
        }
    } else {
        // Scrolling UP: show header and footer
        if (isScrollingDown) {
            isScrollingDown = false;
            header.style.transform = "translateY(0)";
            header.style.opacity = "1";
            navBottom.style.transform = "translateY(0)";
            navBottom.style.opacity = "1";
        }
    }
    
    // Set a timeout to detect when scrolling stops
    scrollTimer = setTimeout(function() {
        // When scrolling stops, always show the header and footer
        if (currentScroll <= 50) { // Near the top of the page
            header.style.transform = "translateY(0)";
            header.style.opacity = "1";
        }
        
        // Always show footer near the bottom of the page
        const bottomPosition = document.body.scrollHeight - window.innerHeight - 50;
        if (currentScroll >= bottomPosition) {
            navBottom.style.transform = "translateY(0)";
            navBottom.style.opacity = "1";
        }
    }, 200);
    
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; // For Mobile or negative scrolling
});

// Add hover effects for footer icons
const footerIcons = document.querySelectorAll("footer img");
footerIcons.forEach(icon => {
    icon.addEventListener("mouseover", function() {
        this.classList.add("fade-in");
    });
    
    icon.addEventListener("mouseout", function() {
        this.classList.remove("fade-in");
    });
});


// API configuration
const API_KEY = '3fd2be6f0c70a2a598f084ddfb75487c'; // This is a public TMDB API key for demo purposes
const BASE_URL = 'https://api.themoviedb.org/3'; // Information about the movie
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'; // Image

// DOM Elements
const banner = document.getElementById('banner');
const bannerTitle = document.getElementById('bannerTitle');
const bannerDescription = document.getElementById('bannerDescription');
const trendingMovies = document.getElementById('trendingMovies');
const popularMovies = document.getElementById('popularMovies');
const topRatedMovies = document.getElementById('topRatedMovies');
const playBannerBtn = document.getElementById('playBannerBtn');
const infoBannerBtn = document.getElementById('infoBannerBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const movieDetails = document.getElementById('movieDetails');
const infoContainer = document.getElementById('infoContainer');
const closeDetailsBtn = document.getElementById('closeDetailsBtn');
const toggleAdultFilterBtn = document.getElementById('adultFilterBtn');
// Loaders
const trendingLoader = document.getElementById('trendingLoader');
const popularLoader = document.getElementById('popularLoader');
const topRatedLoader = document.getElementById('topRatedLoader');

// State
let isAdultFilterEnabled = false;
let featuredMovie = null;

// Initialize the app
function init() {
    closeDetailsBtn.addEventListener('click', () => closeMovieDetails());
    if (window.location.pathname.includes('watchlist.html')) {
        console.log("On watchlist page");
        renderWatchList();
        return
    } else if(window.location.pathname.includes('intro.html')){
        console.log("On intro page");
        return;
    } else if (window.location.pathname.includes('history.html')) {
        console.log("On history page");
        renderHistory();
        return;
    }
    
    setupSimpleAutoComplete();

    const aboutLink = document.querySelector('.about-link');
    if (aboutLink) {
        aboutLink.addEventListener('click', function(e) {
            e.preventDefault();
            showAboutUs();
        });

    }

    // Show loaders
    trendingLoader.style.display = 'block';
    popularLoader.style.display = 'block';
    topRatedLoader.style.display = 'block';

    // Fetch movies for different categories
    fetchMovies('trending/movie/week', trendingMovies, trendingLoader)
        .then(() => fetchMovies('movie/popular', popularMovies, popularLoader))
        .then(() => fetchMovies('movie/top_rated', topRatedMovies, topRatedLoader))
        .then(() => {
            // Set a random trending movie as the banner feature
            if (featuredMovie) {
                setBannerMovie(featuredMovie);
            }
        })
        .catch(error => console.error('Error initializing app:', error));

    // Event listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    toggleAdultFilterBtn.addEventListener('click', toggleAdultFilter);
    infoBannerBtn.addEventListener('click', () => showMovieDetails(featuredMovie));
}

// Fetch movies from API
async function fetchMovies(endpoint, container, loader) {
    try {
        const response = await fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}`);
        const data = await response.json();
        console.log(data)

        // Hide loader
        if (loader) loader.style.display = 'none';

        // Clear container
        // container.innerHTML = ''; not sure what this do

        // Choose a random movie for the banner from trending
        if (endpoint === 'trending/movie/week' && data.results.length > 0) {
            const randomIndex = Math.floor(Math.random() * Math.min(5, data.results.length));
            featuredMovie = data.results[randomIndex];
        }

        // Render each movie
        data.results.forEach(movie => {
            renderMovieCard(movie, container);
        });
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        if (loader) loader.style.display = 'none';
    }
}

// Render a movie card
function renderMovieCard(movie, container, isWatchlistPage = false) {
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    // We'll still add the click event to show details
    card.addEventListener('click', () => showMovieDetails(movie));
   
    const rating = Math.round(movie.vote_average * 10) / 10;
   
    if (!isWatchlistPage) {
        // Standard movie card
        card.innerHTML = `
            <img src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'https://placehold.co/150x225/808080/FFFFFF.png?text=No+Image'}" 
            alt="${movie.title}">
            <div class="rating">${rating}</div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-year">${movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</p>
            </div>
        `;
    } else {
        // Watchlist card with remove button
        card.innerHTML = `
            <img src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'https://placehold.co/150x225/808080/FFFFFF.png?text=No+Image'}" 
            alt="${movie.title}">
            <div class="rating">${rating}</div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.title}</h3>
                <p class="movie-year">${movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</p>
                <button class="remove-btn">Remove</button>
            </div>
        `;
        
        // Add event listener to the remove button, to make sure the DOM is rendered first
        setTimeout(() => {
            const removeBtn = card.querySelector('.remove-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent movie details from showing
                    
                    // Remove from watchlist
                    removeFromWatchlist(movie.id);
                    
                    // Remove card with animation
                    card.style.opacity = '0';
                    setTimeout(() => {
                        card.remove();
                        
                        // Check if watchlist is now empty
                        if (getWatchlist().length === 0) {
                            const watchlistContainer = document.getElementById("watchlistContainer");
                            if (watchlistContainer) {
                                watchlistContainer.innerHTML = '<p style="color: #fff; text-align: center; padding: 20px; grid-column: span 2;">Your watchlist is empty.</p>';
                            }
                        }
                    }, 300);
                });
            }
        }, 0);
    }
   
    container.appendChild(card);
}

// Set banner movie
function setBannerMovie(movie) {
    banner.style.backgroundImage = `url(${IMAGE_BASE_URL + movie.backdrop_path})`;
    bannerTitle.textContent = movie.title;
    bannerDescription.textContent = movie.overview;
}

function handleSearch() {
    console.log("Searching!");
    const query = searchInput.value.trim();
    if (!query) return;
    
    // Create a loader for search results
    const searchLoader = document.createElement('div');
    searchLoader.className = 'loader';
    searchLoader.style.display = 'block';

    // Remove old search results if they exist
    const oldSearchSection = document.getElementById('searchResultsSection');
    if (oldSearchSection) {
        oldSearchSection.remove();
    }

    // Create a container for search results
    const searchResults = document.createElement('div');
    searchResults.className = 'movie-row';
    searchResults.id = 'searchResults';
    searchResults.appendChild(searchLoader);

    // Create a section for search results
    const searchSection = document.createElement('section');
    searchSection.className = 'categories';
    searchSection.id = 'searchResultsSection';
    
    // Check if this is an actor search (if query starts with "actor:")
    const isActorSearch = query.toLowerCase().startsWith("actor:");
    let searchTitle = "";
    
    if (isActorSearch) {
        const actorName = query.substring(6).trim(); // Remove "actor:" prefix
        searchTitle = `Movies with ${actorName}`;
        searchSection.innerHTML = `<h2 class="category-title">${searchTitle}</h2>`;
    } else {
        searchTitle = `Search Results for "${query}"`;
        searchSection.innerHTML = `<h2 class="category-title">${searchTitle}</h2>`;
    }
    
    searchSection.appendChild(searchResults);

    // Insert search results after the banner
    const categoriesSection = document.querySelector('.categories');
    categoriesSection.parentNode.insertBefore(searchSection, categoriesSection);

    // Run the appropriate search based on the query type
    if (isActorSearch) {
        const actorName = query.substring(6).trim(); // Remove "actor:" prefix
        searchByActor(actorName, searchResults, searchLoader);
    } else {
        searchByTitle(query, searchResults, searchLoader);
    }
}

function searchByTitle(query, resultsContainer, loader) {
    // Include adult filter parameter
    const includeAdult = !isAdultFilterEnabled;
    
    fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&include_adult=${includeAdult}`)
        .then(response => response.json())
        .then(data => {
            displaySearchResults(data, resultsContainer, loader);
        })
        .catch(error => {
            console.error('Error searching movies:', error);
            loader.style.display = 'none';
            resultsContainer.innerHTML = '<p style="color: #aaa; padding: 20px;">Error searching movies. Please try again.</p>';
        });

    // Clear search input
    searchInput.value = '';

    // Scroll to search results
    document.getElementById('searchResultsSection').scrollIntoView({ behavior: 'smooth' });
}

function searchByActor(actorName, resultsContainer, loader) {
    // First search for the actor to get their ID
    fetch(`${BASE_URL}/search/person?api_key=${API_KEY}&query=${encodeURIComponent(actorName)}`)
        .then(response => response.json())
        .then(data => {
            if (data.results && data.results.length > 0) {
                // Get the first matching actor's ID
                const actorId = data.results[0].id;
                
                // Then fetch movies with this actor
                return fetch(`${BASE_URL}/person/${actorId}/movie_credits?api_key=${API_KEY}`);
            } else {
                throw new Error('Actor not found');
            }
        })
        .then(response => response.json())
        .then(data => {
            // Filter adult movies if filter is enabled
            let movies = data.cast || [];
            if (isAdultFilterEnabled) {
                movies = movies.filter(movie => !movie.adult);
            }
            
            // Create a data object that matches the structure expected by displaySearchResults
            const formattedData = {
                results: movies
            };
            
            displaySearchResults(formattedData, resultsContainer, loader);
        })
        .catch(error => {
            console.error('Error searching actor:', error);
            loader.style.display = 'none';
            resultsContainer.innerHTML = '<p style="color: #aaa; padding: 20px;">Actor not found or error searching. Please try again.</p>';
        });

    // Clear search input
    searchInput.value = '';

    // Scroll to search results
    document.getElementById('searchResultsSection').scrollIntoView({ behavior: 'smooth' });
}

// Common function to display search results 
function displaySearchResults(data, resultsContainer, loader) {
    console.log("SEARCH RESULTS:", data);
    loader.style.display = 'none';

    if (data.results.length === 0) {
        resultsContainer.innerHTML = '<p style="color: #aaa; padding: 20px;">No results found.</p>';
        return;
    }

    // Clear current results
    resultsContainer.innerHTML = '';
    
    // Add all movies to results
    data.results.forEach(movie => {
        renderMovieCard(movie, resultsContainer);
    });
}

// MOVIE DETAILS CONFIGURATION
// Show movie details page
function showMovieDetails(movie) {
    if (!movie){
        console.error("No movie data are provided to showMovieDetails");
        return;  
    } 

    addToHistory(movie);
    // Check if movie is in watchlist
    const watchlist = getWatchlist();
    const isInWatchlist = watchlist.some(item => item.id === movie.id);

    // Fetch additional movie details if needed
    fetch(`${BASE_URL}/movie/${movie.id}?api_key=${API_KEY}`)
        .then(response => response.json())
        .then(movieData => {
            // Create movie details HTML
            infoContainer.innerHTML = `
                <h1>${movie.title}</h1>
                <div class="movie-card">
                    <img src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'https://placehold.co/150x225/808080/FFFFFF.png?text=No+Image'}" alt="${movie.title}">
                    <div class="ratings">
                        <p>IMDb: ${movie.vote_average}/10 (${movie.vote_count} votes)</p>
                        <p>Release Date: ${movie.release_date || 'N/A'}</p>
                        <p>Genre: ${movieData.genres ? movieData.genres.map(g => g.name).join(', ') : 'N/A'}</p>
                        <p>Runtime: ${movieData.runtime ? `${movieData.runtime} minutes` : 'N/A'}</p>
                        
                        <div class="action-buttons">
                            <button class="play-btn-info" id="detailsPlayBtn">Play</button>
                            <button class="watchlist-btn-info" id="toggleWatchlistBtn">
                                ${isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                            </button>
                        </div>
                    </div>
                </div>
                <section class="synopsis">
                    <h2>Synopsis</h2>
                    <p>${movie.overview || 'No synopsis available.'}</p>
                </section>
            `;
            
            // Add event listener to play button
            const detailsPlayBtn = document.getElementById('detailsPlayBtn');
            if (detailsPlayBtn) {
                detailsPlayBtn.addEventListener('click', () => {
                    // Play movie functionality would go here. not usable as of currently
                });
            }

            // Style the watchlist button based on current status
            const toggleWatchlistBtn = document.getElementById('toggleWatchlistBtn');
            if (toggleWatchlistBtn) {
                // Set initial button style based on watchlist status
                if (isInWatchlist) {
                    toggleWatchlistBtn.style.backgroundColor = '#333';
                    toggleWatchlistBtn.style.color = '#fff';
                    toggleWatchlistBtn.style.fontSize = '12px';
                }

                toggleWatchlistBtn.addEventListener('click', () => {
                    toggleMovieInWatchlist(movie, toggleWatchlistBtn);
                });
            }
            
            // Show movie details
            movieDetails.style.display = 'block';
        })
        .catch(error => {
            console.error('Error fetching movie details:', error);
            // Show basic details if fetch fails with similar watchlist functionality
            const isInWatchlist = watchlist.some(item => item.id === movie.id);
            
            infoContainer.innerHTML = `
                <h1>${movie.title}</h1>
                <div class="movie-card">
                    <img src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'https://placehold.co/150x225/808080/FFFFFF.png?text=No+Image'}" alt="${movie.title}">
                    <div class="ratings">
                        <p>IMDb: ${movie.vote_average}/10 (${movie.vote_count} votes)</p>
                        
                        <div class="action-buttons">
                            <button class="play-btn-info" id="detailsPlayBtn">Play</button>
                            <button class="watchlist-btn-info" id="toggleWatchlistBtn">
                                ${isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                            </button>
                        </div>
                    </div>
                </div>
                <section class="synopsis">
                    <h2>Synopsis</h2>
                    <p>${movie.overview || 'No synopsis available.'}</p>
                </section>
            `;
            
            // Add event listeners (same as above)
            const detailsPlayBtn = document.getElementById('detailsPlayBtn');
            if (detailsPlayBtn) {
                detailsPlayBtn.addEventListener('click', () => {
                    // Play functionality
                });
            }
            
            const toggleWatchlistBtn = document.getElementById('toggleWatchlistBtn');
            if (toggleWatchlistBtn) {
                if (isInWatchlist) {
                    toggleWatchlistBtn.style.backgroundColor = '#333';
                    toggleWatchlistBtn.style.color = '#fff';
                    toggleWatchlistBtn.style.fontSize = '12px';
                }
                
                toggleWatchlistBtn.addEventListener('click', () => {
                    toggleMovieInWatchlist(movie, toggleWatchlistBtn);
                });
            }
            
            movieDetails.style.display = 'block';
        });
}
// Close movie details
function closeMovieDetails() {
    console.log("Close info");
    movieDetails.style.display = 'none';
}
// Toggle Watchlist button
function toggleMovieInWatchlist(movie, button) {
    if (!movie || !movie.id) {
        console.error("Invalid movie object for watchlist toggle");
        return;
    }
    
    let watchlist = getWatchlist();
    const movieIndex = watchlist.findIndex(item => item.id === movie.id);
    
    if (movieIndex === -1) {
        // Movie not in watchlist - add it
        addToWatchlist(movie);
        
        // Update button
        button.textContent = 'Remove from Watchlist';
        button.style.backgroundColor = '#333';
        button.style.fontSize = '12px';
        
        console.log(`${movie.title} added to watchlist`);
    } else {
        removeFromWatchlist(movie.id);

        // Rerender watchlist
        renderWatchList();
        // Update button
        button.textContent = 'Add to Watchlist';
        button.style.backgroundColor = 'var(--primary-color)';
        button.style.fontSize = '16px';
        
        console.log(`${movie.title} removed from watchlist`);
    }
}
// Toggle adult filter button
function toggleAdultFilter(){
    isAdultFilterEnabled = !isAdultFilterEnabled;
    
    // Update button appearance
    if (isAdultFilterEnabled) {
        toggleAdultFilterBtn.classList.add('filter-active');
        toggleAdultFilterBtn.textContent = "Adult: Off";
    } else {
        toggleAdultFilterBtn.classList.remove('filter-active');
        toggleAdultFilterBtn.textContent = "Adult: On";
    }
    
    // If there's an active search, refresh it with the new filter
    if (searchInput.value.trim()) {
        handleSearch();
    }
}


// WATCHLIST EDITOR
// Add movie to local storage, get watchlist, add movie, set watchlist back to normal.
function addToWatchlist(movie){
    if (movie && movie.title && movie.poster_path) {  // Add validation to check if movie is valid
        let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        
        // Check if the movie is already in the watchlist (optional, to prevent duplicates)
        if (!watchlist.some(existingMovie => existingMovie.title === movie.title)) {
            watchlist.push(movie);
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            console.log(`${movie.title} added to the watchlist!`);
        } else {
            console.log(`${movie.title} is already in the watchlist.`);
        }
    } else {
        console.error("Invalid movie object:", movie);  // Log an error if movie is not valid
    }
}
// Function to remove a movie from watchlist by ID
function removeFromWatchlist(movieId) {
    let watchlist = getWatchlist();
    const updatedWatchlist = watchlist.filter(movie => movie.id !== movieId);
    localStorage.setItem('watchlist', JSON.stringify(updatedWatchlist));
    console.log(`Movie ID ${movieId} removed from watchlist`);
}

function getWatchlist(){
    return JSON.parse(localStorage.getItem('watchlist')) || [];
}

function renderWatchList() {
    console.log("WATCHLIST OPENED");
    const watchlistContainer = document.getElementById("watchlistContainer");
    
    // Clear the container first
    if (watchlistContainer) {
        watchlistContainer.innerHTML = '';
        
        const watchlist = getWatchlist();
        console.log("Watchlist items:", watchlist.length);
        
        if (watchlist.length === 0) {
            watchlistContainer.innerHTML = '<p style="color: #fff; text-align: center; padding: 20px; grid-column: span 2;">Your watchlist is empty.</p>';
        } else {
            // Add CSS for smooth removal animation
            const style = document.createElement('style');
            style.textContent = `
                .movie-card {
                    transition: opacity 0.3s ease;
                }
            `;
            document.head.appendChild(style);
            
            // Add the movies to the grid
            watchlist.forEach((movie) => {
                renderMovieCard(movie, watchlistContainer, true); // Pass true to indicate watchlist page
            });
        }
    } else {
        console.error("Watchlist container not found!");
    }
}

// ABOUT US FUNCTIONS
// javascript function for the AboutUs page
function showAboutUs() {
    // Create the about us overlay if it doesn't exist
    if (!document.getElementById('aboutUsOverlay')) {
        // Create the main container
        const aboutUsOverlay = document.createElement('div');
        aboutUsOverlay.id = 'aboutUsOverlay';
        
        // Create the close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = closeAboutUs;
        
        // Create the content container
        const aboutUsContent = document.createElement('div');
        aboutUsContent.className = 'info-container';
        
        // Create the about us content
        aboutUsContent.innerHTML = `
            <h1>About MovieFlix</h1>
            
            <section>
                <h2>Our Mission</h2>
                <p>At MovieFlix, we believe everyone deserves access to exceptional entertainment. Our mission is to provide a seamless streaming experience with a vast library of movies across all genres, from blockbuster hits to indie gems.</p>
                <p>We're committed to leveraging cutting-edge technology to deliver the highest quality streaming service, ensuring you never miss a moment of your favorite films.</p>
            </section>
            
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">
                        <img class="feature-icon" src="img/vast-library.jpg" alt="Vast Library">
                    </div>
                    <div class="feature-content">
                        <h3>Vast Library</h3>
                        <p>Access thousands of movies across every genre imaginable, from action-packed blockbusters to thought-provoking documentaries.</p>
                    </div>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">
                        <img class="feature-icon" src="img/premium-quality.jpg" alt="Premium Quality">
                    </div>
                    <div class="feature-content">
                        <h3>Stay Updated on Trending Movies</h3>
                        <p>Never miss out on trending films! We keep you in the loop with the latest movie releases, popular picks, and community favorites so you can always stay ahead in the world of cinema.</p>
                    </div>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">
                        <img class="feature-icon" src="img/watchlist.png" alt="Premium Quality">
                    </div>
                    <div class="feature-content">
                        <h3>Build Your Watchlist</h3>
                        <p>Easily save your favorite movies and create a personalized watchlist! Keep track of the films you want to see, and make sure you never miss out on the titles that catch your eye.</p>
                    </div>
                </div>
            </div>
            
            <section style="text-align: center;">
                <h2>Meet Our Team</h2>
                <div class="team-grid">
                    <div class="team-member">
                        <div>
                            <img class="team-photo" src="Kevin.jpg" alt="Kevin"></div>
                        <h3 class="team-name">KEVIN JOHN DOWD</h3>
                        <p class="team-role">Founder & CEO</p>
                    </div>
                    <div class="team-member">
                        <div >
                            <img class="team-photo" src="img/santosh.jpg" alt="santosh">
                        </div>
                        <h3 class="team-name">SANTOSH ADHIKARI</h3>
                        <p class="team-role">Chief Technology Officer</p>
                    </div>
                    <div class="team-member">
                        <div >
                            <img class="team-photo" src="img/joan.jpg" alt="joan">
                        </div>
                        <h3 class="team-name">JOHN ALLYSEN</h3>
                        <p class="team-role">Content Director</p>
                    </div>
                    <div class="team-member">
                        <div>
                            <img class="team-photo" src="img/vishesh.jpg" alt="vishesh">
                        </div>
                        <h3 class="team-name">VISHESH GROVER</h3>
                        <p class="team-role">UX Designer</p>
                    </div>
                </div>
            </section>
            
            <section style="text-align: center;">
                <h2>Join MovieFlix Today</h2>
                <p>Start streaming today and discover why millions of movie enthusiasts choose MovieFlix as their go to movie review website</p>
                <button class="cta-button">Start Your Free Trial</button>
            </section>
        `;
        
        // Append elements to the DOM
        aboutUsOverlay.appendChild(closeBtn);
        aboutUsOverlay.appendChild(aboutUsContent);
        document.body.appendChild(aboutUsOverlay);
    } else {
        // Show the existing overlay if it's already created
        document.getElementById('aboutUsOverlay').style.display = 'block';
    }
    
    // Disable body scrolling when overlay is shown
    document.body.style.overflow = 'hidden';
}

// Function to close About Us overlay
function closeAboutUs() {
    const aboutUsOverlay = document.getElementById('aboutUsOverlay');
    if (aboutUsOverlay) {
        aboutUsOverlay.style.display = 'none';
    }
    // Re-enable body scrolling
    document.body.style.overflow = 'auto';
}

// TRANSITION AND AUTOCOMPLETE
function transitionTo(url){
    const overlay = document.querySelector(".transition-overlay");
    overlay.style.animation = 'slideIn 0.1s ease-in-out';
    setTimeout(()=>{
        window.location.href = url;
    }, 500);
}

function setupSimpleAutoComplete(){
    const searchContainer = searchInput.parentElement;

    const dropdown = document.createElement('div');
    dropdown.id = 'autocompleteDropdown';
    dropdown.className = 'autocomplete-dropdown';
    searchContainer.appendChild(dropdown);


    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length > 0) {
            fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                
                dropdown.innerHTML = '';
                
                if (data.results && data.results.length > 0) {
                    data.results.slice(0, 10).forEach(movie => {
                    const item = document.createElement('div');
                    item.className = 'autocomplete-item';
                    item.textContent = movie.title;
                    
                    item.addEventListener('click', () => {
                        searchInput.value = movie.title;
                        dropdown.style.display = 'none';
                    });
                    
                    dropdown.appendChild(item);
                });
                
                    dropdown.style.display = 'block';
                } else {
                    dropdown.style.display = 'none';
                }
            })
        .catch(error => {
            console.error('Error fetching suggestions:', error);
            dropdown.style.display = 'none';
        });
    } else {
        dropdown.style.display = 'none';
    }
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
    if (!searchContainer.contains(e.target)) {
        dropdown.style.display = 'none';
        }
    });
}

// HISTORY FUNCTIONS
function getHistory(){
    return JSON.parse(localStorage.getItem('movieHistory')) || [];
}

function addToHistory(movie){
    if(!movie || !movie.id){
        console.log("Movie is invalid")
        return;
    }

    let history = getHistory();
    history = history.filter(item=> item.id != movie.id);

    const historyItem = {
        ...movie, 
        viewedAt: new Date().toISOString()
    }

    history.unshift(historyItem);

    if (history.length > 20){
        history = history.slice(0, 20);
    }

    localStorage.setItem('movieHistory', JSON.stringify(history));
    console.log(`${movie.title} added to history`);
}

function clearHistory() {
    localStorage.removeItem('movieHistory');
    console.log("History cleared");
    
    // Refresh the history page
    renderHistory();
}

function renderHistory() {
    console.log("HISTORY PAGE OPENED");
    const historyContainer = document.getElementById("historyContainer");
    
    if (historyContainer) {
        historyContainer.innerHTML = '';
        
        const history = getHistory();
        console.log("History items:", history.length);
        
        if (history.length === 0) {
            historyContainer.innerHTML = '<p class="empty-message">Your viewing history is empty.</p>';
        } else {
            // Add clear history button at the top
            const clearButton = document.createElement('button');
            clearButton.className = 'clear-history-btn';
            clearButton.textContent = 'Clear History';
            clearButton.addEventListener('click', clearHistory);
            
            const buttonContainer = document.createElement('div');
            buttonContainer.style.textAlign = 'center';
            buttonContainer.style.marginBottom = '20px';
            buttonContainer.appendChild(clearButton);
            
            // Insert button before the container
            historyContainer.parentNode.insertBefore(buttonContainer, historyContainer);
            
            // Render all history items
            history.forEach((movie) => {
                const card = document.createElement('div');
                card.className = 'movie-card';
                
                // Add click event to show details
                card.addEventListener('click', () => showMovieDetails(movie));
                
                const rating = Math.round(movie.vote_average * 10) / 10;
                
                // Format the date for display
                let timeDisplay = 'Recently viewed';
                if (movie.viewedAt) {
                    const viewDate = new Date(movie.viewedAt);
                    const options = { 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit'
                    };
                    timeDisplay = `Viewed: ${viewDate.toLocaleDateString('en-US', options)}`;
                }
                
                card.innerHTML = `
                    <img src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'https://placehold.co/150x225/808080/FFFFFF.png?text=No+Image'}" 
                    alt="${movie.title}">
                    <div class="rating">${rating}</div>
                    <div class="movie-info">
                        <h3 class="movie-title">${movie.title}</h3>
                        <p class="movie-year">${movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}</p>
                        <p class="movie-timestamp">${timeDisplay}</p>
                    </div>
                `;
                
                historyContainer.appendChild(card);
            });
        }
    } else {
        console.error("History container not found!");
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);