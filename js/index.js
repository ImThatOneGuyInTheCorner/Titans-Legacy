document.addEventListener("DOMContentLoaded", function () {
    // Add listener to create start button
    if ( document.getElementById('how-to-play-overlay') !== null) {
        let howToPlay = document.getElementById('howToPlay');
        howToPlay.addEventListener('click', overlayShuffle)
    }
    if ( document.getElementById('closeHowToPlayButton') !== null) {
        let howToPlay = document.getElementById('closeHowToPlayButton');
        howToPlay.addEventListener('click', overlayShuffle)
    }
});
function overlayShuffle() {
    document.getElementById("how-to-play-overlay").classList.toggle("hidden");
    document.getElementById("how-to-play-overlay").classList.toggle("flex");
}