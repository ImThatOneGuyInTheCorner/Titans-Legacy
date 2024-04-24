document.addEventListener("DOMContentLoaded", function () {
    // How to play screen
    if ( document.getElementById('how-to-play-overlay') !== null) {
        let howToPlay = document.getElementById('howToPlay');
        howToPlay.addEventListener('click', overlayShuffle)
    }
    if ( document.getElementById('closeHowToPlayButton') !== null) {
        let howToPlay = document.getElementById('closeHowToPlayButton');
        howToPlay.addEventListener('click', overlayShuffle)
    }

    // Credits
    if ( document.getElementById('credits-overlay') !== null) {
        let credits = document.getElementById('credits');
        credits.addEventListener('click', overlayShuffleTwo)
    }
    if ( document.getElementById('closeCreditsButton') !== null) {
        let credits = document.getElementById('closeCreditsButton');
        credits.addEventListener('click', overlayShuffleTwo)
    }
});
function overlayShuffle() {
    document.getElementById("how-to-play-overlay").classList.toggle("hidden");
    document.getElementById("how-to-play-overlay").classList.toggle("flex");
}
function overlayShuffleTwo() {
    document.getElementById("credits-overlay").classList.toggle("hidden");
    document.getElementById("credits-overlay").classList.toggle("flex");
    
}