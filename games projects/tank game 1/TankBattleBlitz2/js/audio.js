// Audio Setup
const shootSound = new Audio("assets/shoot.wav");
const explosionSound = new Audio("assets/explosion.wav");
const backgroundMusic = new Audio("assets/background_music.mp3");
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;
backgroundMusic.play().catch(e => console.log("Music error:", e));