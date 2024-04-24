

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

document.addEventListener("DOMContentLoaded", function () {
    // Add listener to create start button
    if ( document.getElementById('credits-overlay') !== null) {
        let credits = document.getElementById('Credits');
        credits.addEventListener('click', overlayShuffle)
    }
});
function overlayShuffle() {
    document.getElementById("credits-overlay").classList.toggle("hidden");
}