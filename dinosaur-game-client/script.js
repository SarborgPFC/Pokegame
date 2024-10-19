// Select the dino (green box) and obstacle (red box) elements
const dino = document.getElementById("dino"); // Green box
const obstacle = document.getElementById("obstacle"); // Red box
const gameOverDiv = document.getElementById("game-over"); // Game Over box
const scoreCounter = document.getElementById('score-counter'); // Score Counter
const gameArea = document.querySelector('.game-area'); // Select the game area
const playerNameInput = document.getElementById('playerName'); // Player name input field
const submitScoreBtn = document.getElementById('submitScoreBtn'); // Submit button
const skipBtn = document.getElementById('skipBtn'); // Skip button
const highscoreMenu = document.getElementById('highscore-menu');
const highscoreList = document.getElementById('highscore-list');

// Variables to manage jumping and obstacle movement
let isJumping = false;
let jumpHeight = 150;
let jumpSpeed = 20;
let gravity = 2;
let obstacleSpeed = 4;
let gameOver = false; // Flag to track game over state
let score = 0; // Initialize the score
let scoreInterval; // Declare scoreInterval globally so we can stop it
let obstacleInterval; // Declare obstacleInterval globally so we can stop it

// Function to make the dino (green box) jump
function jump() {
    if (isJumping || gameOver) return; // Prevent multiple jumps or jumping after game over
    isJumping = true;

    let jumpUp = 0; // Start jump height

    // Jump up
    let upInterval = setInterval(() => {
        if (jumpUp >= jumpHeight) {
            clearInterval(upInterval); // Stop going up
            // Start falling down after reaching jump height
            let downInterval = setInterval(() => {
                if (jumpUp <= 0) {
                    clearInterval(downInterval); // Stop falling
                    isJumping = false; // Ready for next jump
                } else {
                    jumpUp -= gravity; // Apply gravity
                    dino.style.bottom = jumpUp + 'px';
                }
            }, 8);
        } else {
            jumpUp += jumpSpeed; // Jumping up
            dino.style.bottom = jumpUp + 'px';
        }
    }, 15);
}

// Function to detect collision between dino and obstacle
function checkCollision() {
    const dinoRect = dino.getBoundingClientRect(); // Get dino's position and size
    const obstacleRect = obstacle.getBoundingClientRect(); // Get obstacle's position and size

    // Check for collision (AABB - Axis-Aligned Bounding Box)
    if (
        dinoRect.left < obstacleRect.left + obstacleRect.width && // Dino's right passes obstacle's left
        dinoRect.left + dinoRect.width > obstacleRect.left &&     // Dino's left passes obstacle's right
        dinoRect.top < obstacleRect.top + obstacleRect.height &&  // Dino's bottom passes obstacle's top
        dinoRect.top + dinoRect.height > obstacleRect.top         // Dino's top passes obstacle's bottom
    ) {
        return true; // Collision detected
    }

    return false; // No collision
}

// Function to move the obstacle (red box) towards the dino (green box)
function moveObstacle() {
    let obstacleLeft = 800; // Start position of the obstacle off-screen

    obstacleInterval = setInterval(() => {
        if (gameOver) return; // Stop obstacle movement if the game is over

        obstacleLeft -= obstacleSpeed; // Move the obstacle to the left
        obstacle.style.left = obstacleLeft + 'px'; // Update the obstacle's position

        // Check for collision
        if (checkCollision()) {
            stopGame(); // Call stopGame() when collision happens
            return; // Stop further execution
        }

        // Reset obstacle position when it goes off-screen
        if (obstacleLeft <= -30) {
            obstacleLeft = 800; // Reset position to the right
        }
    }, 10); // Adjust for smooth movement
}

// Function to increment the score by 10 every 0.5 seconds
function incrementScore() {
    if (!gameOver) {
        score += 10;
        scoreCounter.textContent = `Score: ${score}`; // Update the score display
    }
}

// Start incrementing the score every 0.5 seconds
function startScoreCounter() {
    scoreInterval = setInterval(incrementScore, 500); // 500 milliseconds = 0.5 seconds
}

// Function to save the player's score
function saveScore(playerName, playerScore) {
    return fetch('http://localhost:3000/save-score', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            playerName: playerName,
            score: playerScore,
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();
    })
    .then(data => {
        console.log(data); // Log success message or handle UI changes
    })
    .catch((error) => {
        console.error('Error:', error);
        throw error; // Rethrow error to be caught in stopGame()
    });
}

// To stop the score when the game ends
function stopGame() {
    gameOver = true;
    clearInterval(scoreInterval); // Stop the score counter
    clearInterval(obstacleInterval); // Stop the obstacle movement
    gameOverDiv.style.display = "block"; // Show the Game Over message
    gameArea.style.backgroundImage = "url('icons/Game_over.png')"; // Change to game over image

    // Remove any previous event listener to avoid duplicate listeners
    submitScoreBtn.removeEventListener('click', submitScoreHandler);

    // Add a listener to the submit button to save the score
    submitScoreBtn.addEventListener('click', submitScoreHandler);

    // Add event listener to the skip button
    skipBtn.addEventListener('click', skipToRestart);
}

// Function to handle score submission
function submitScoreHandler() {
    const playerName = playerNameInput.value;
    if (playerName) {
        saveScore(playerName, score) // Send playerName and score to backend
        .then(() => {
            // Hide the game over div and show the confirmation message
            gameOverDiv.style.display = "none"; // Hide the game-over div

            // Find or create the "game-over-confirmation" div
            let confirmationMessage = document.getElementById('game-over-confirmation');
            if (!confirmationMessage) {
                confirmationMessage = document.createElement('div');
                confirmationMessage.id = 'game-over-confirmation';
                document.body.appendChild(confirmationMessage);
            }
            confirmationMessage.innerHTML = 'Score submitted! Press Space to restart the game.';
            confirmationMessage.style.display = 'block'; // Show the confirmation message

            // Add listener for "Space" key to restart the game
            document.addEventListener("keydown", restartGameOnSpace);
        })
        .catch(() => {
            alert("Error submitting score. Please try again.");
        });
    } else {
        alert("Please enter your name."); // Alert if the player hasn't entered a name
    }
}

// Function for the "Skip" button
function skipToRestart() {
    gameOverDiv.style.display = "none"; // Hide the game-over div

    // Show "Press Space to restart" message
    let confirmationMessage = document.getElementById('game-over-confirmation');
    if (!confirmationMessage) {
        confirmationMessage = document.createElement('div');
        confirmationMessage.id = 'game-over-confirmation';
        document.body.appendChild(confirmationMessage);
    }
    confirmationMessage.innerHTML = 'Press Space to restart the game.';
    confirmationMessage.style.display = 'block'; // Show the confirmation message

    // Add listener for "Space" key to restart the game
    document.addEventListener("keydown", restartGameOnSpace);
}

// Enforce 12-character limit on the player name input field
playerNameInput.addEventListener('input', () => {
    if (playerNameInput.value.length > 12) {
        playerNameInput.value = playerNameInput.value.slice(0, 12); // Limit input to 12 characters
    }
});

// Function to load high scores and populate the list
async function loadHighScores() {
    try {
        const response = await fetch('http://localhost:3000/scores'); // Fetch scores from the backend
        const scores = await response.json();

        console.log("Fetched scores:", scores); // Log the scores for debugging

        // Limit to maximum of 250 scores
        const maxScores = 250;
        const limitedScores = scores.slice(0, maxScores); // Get only the first 250 scores

        // Clear the current list (if any)
        highscoreList.innerHTML = '';

        // Display only the first 5 scores initially
        limitedScores.slice(0, 5).forEach((score) => {
            if (score.playerName && score.score) { // Skip entries with null values
                const listItem = document.createElement('li');
                listItem.textContent = `${score.playerName}: ${score.score}`;
                highscoreList.appendChild(listItem);
            }
        });

        // Add remaining scores (6 to 250) to the list in a scrollable area
        if (limitedScores.length > 5) {
            limitedScores.slice(5).forEach((score) => {
                if (score.playerName && score.score) { // Skip entries with null values
                    const listItem = document.createElement('li');
                    listItem.textContent = `${score.playerName}: ${score.score}`;
                    highscoreList.appendChild(listItem);
                }
            });
        }

        console.log("Highscores updated in DOM."); // Log when scores are added to the DOM
    } catch (error) {
        console.error('Error fetching high scores:', error);
    }
}

// Call this function when the DOM is loaded to fetch and display the high scores
document.addEventListener('DOMContentLoaded', loadHighScores);

// Function to restart the game when "Space" is pressed
function restartGameOnSpace(event) {
    if (event.code === "Space") {
        const confirmationMessage = document.getElementById('game-over-confirmation');
        if (confirmationMessage) {
            confirmationMessage.style.display = 'none'; // Hide the confirmation message
        }
        location.reload(); // Reload the page to restart the game
    }
}

// Start moving the obstacle and score counter
moveObstacle();
startScoreCounter(); // Start counting the score

// Add event listener for jumping and restarting the game
document.addEventListener("keydown", function(event) {
    // Check if the input field is focused
    if (document.activeElement === playerNameInput) {
        // Do nothing if the player is typing in the name input
        return;
    }

    if (event.code === "Space") {
        if (gameOver) {
            location.reload(); // Reload the page to restart the game
        } else {
            jump(); // Trigger jump on spacebar
        }
    }
});
