

document.addEventListener("DOMContentLoaded", function () {
    // Add listener to create start button
    if ( document.getElementById('how-to-play-overlay') !== null) {
        let howToPlay = document.getElementById('howToPlay');
        howToPlay.addEventListener('click', overlayShuffle)
    }
});
function overlayShuffle() {
    document.getElementById("how-to-play-overlay").classList.toggle("hidden");
}