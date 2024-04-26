//PvE

let attackBtn;
let dodgeBtn;
let braceBtn;
let healBtn;
document.addEventListener("DOMContentLoaded",()=>{
    attackBtn = document.getElementById("playerAttackBtn");
    dodgeBtn = document.getElementById("playerDodgeBtn");
    braceBtn = document.getElementById("playerBraceBtn");
    healBtn = document.getElementById("playerHealBtn");
})
let enemyDiff = "hard";


function banditTBC(enemyDiff) {
    function checkResult(enemyHealth, playerHealth) {
        console.log("Enemy Health:", enemyHealth);
        console.log("Player Health:", playerHealth);
        if (enemyHealth <= 0) {
            console.log("win");
            return;
        }
        if (playerHealth <= 0) {
            console.log("loss");
            return;
        }
        else {
            return;
        }
    }
    
    function enemyAttack(brace) {
        let atkDmg;
        if (brace === "braced") {
            atkDmg = Math.floor(Math.random() * 10);
        } else {
            atkDmg = Math.floor(Math.random() * 20) + 10;
        }
        return (playerHealth -= atkDmg);
    }

    let enemyHealth = 100;
    if (enemyDiff === "hard") {
        enemyHealth = 130;
    }
    if (enemyDiff === "easy") {
        enemyHealth = 80;
    }
    let playerHealth = 100;

    function attack() {
        if (playerHealth || enemyHealth <= 0) {
            return;
        }
        let atkDmg = Math.floor(Math.random() * 20 + 10);
        enemyHealth -= atkDmg;
        checkResult(enemyHealth, playerHealth);
        enemyAttack();
    }

    function dodge() {
        if (playerHealth || enemyHealth <= 0) {
            return;
        }
        let dodgeChance = Math.random();
        if (dodgeChance < 0.3) {
            enemyAttack("notBraced");
        }
        checkResult(enemyHealth, playerHealth);
    }

    function brace() {
        if (playerHealth || enemyHealth <= 0) {
            return;
        }
        let braceChance = Math.random();
        if (braceChance < 0.7) {
            enemyAttack("braced");
        } else {
            enemyAttack();
        }
        checkResult(enemyHealth, playerHealth);
    }

    function heal() {
        if (playerHealth || enemyHealth <= 0) {
            return;
        }
        let healNmb = Math.floor(Math.random() * 20) + 10;
        playerHealth += healNmb;
        if (playerHealth > 100) {
            playerHealth = 100;
        }
        checkResult(enemyHealth, playerHealth);
        enemyAttack();
    }

    attackBtn.addEventListener("click", attack);
    dodgeBtn.addEventListener("click", dodge);
    braceBtn.addEventListener("click", brace);
    healBtn.addEventListener("click", heal);
}

// function ravangeTBC(enemyDiff) {

//     // function endTBC(result) {
//     //     if (result === "win") {
//     //         //GIVE PLAYER RESOURCES
//     //     } else if (result === "lose") {
//     //         //CLOSE PVE OVERLAY
//     //     }
//     //     //CLOSE PVE OVERLAY
//     // }


//     // function checkResult() {
//     //     console.log("Enemy Health,", enemyHealth);
//     //     console.log("Player Health,", playerHealth);
//     //     if (enemyHealth <= 0) {
//     //         endTBC("win");
//     //     }
//     //     if (playerHealth <= 0) {
//     //         endTBC("lose");
//     //     }
//     // }

//     // function enemyAttack(brace, enemyDiff) {
//     //     if (brace === "braced") {
//     //         let atkDmg = Math.floor(Math.random() * 10);
//     //         playerHealth -= atkDmg;
//     //     } else {
//     //         let atkDmg = Math.floor(Math.random() * 20) + 10;
//     //         playerHealth -= atkDmg;
//     //     }
//     //     checkResult();
//     // }


//     let enemyHealth = 100;
//     if (enemyDiff === "hard") {
//         enemyHealth = 130;
//     }
//     if (enemyDiff === "easy") {
//         enemyHealth = 80;
//     }
//     let playerHealth = 80;

//     function attack() {
//         let atkDmg = 0;
//         let doubleAttack = Math.random();
//         if (doubleAttack > 0.7) {
//             atkDmg = Math.floor(Math.random() * 20) + Math.floor(Math.random() * 10)
//         } else {
//             atkDmg = Math.floor(Math.random() * 20);
//         }
//         enemyHealth -= atkDmg;
//         checkResult();
//         enemyAttack();
//     }

//     function dodge() {
//         let dodgeChance = Math.random();
//         if (dodgeChance > 0.3) {
//             enemyAttack();
//         }
//         checkResult();

//     }

//     function brace() {
//         let braceChance = Math.random();
//         if (braceChance < 0.7) {
//             enemyAttack("braced");
//         } else {
//             enemyAttack();
//         }
//         checkResult();

//     }

//     function heal() {
//         let healNmb = Math.floor(Math.random() * 20) + 10;
//         playerHealth += healNmb;
//         if (playerHealth > 100) {
//             playerHealth = 100;
//         }
//         checkResult();
//         enemyAttack();
//     }



//     attackBtn.addEventListener("click", attack);
//     dodgeBtn.addEventListener("click", dodge);
//     braceBtn.addEventListener("click", brace);
//     healBtn.addEventListener("click", heal);
// }


// function brutusTBC(enemyDiff) {

//     // function endTBC(result) {
//     //     if (result === "win") {
//     //         //GIVE PLAYER RESOURCES
//     //     } else if (result === "lose") {
//     //         //CLOSE PVE OVERLAY
//     //     }
//     //     //CLOSE PVE OVERLAY
//     // }


//     // function checkResult() {
//     //     console.log("Enemy Health,", enemyHealth);
//     //     console.log("Player Health,", playerHealth);
//     //     if (enemyHealth <= 0) {
//     //         endTBC("win");
//     //     }
//     //     if (playerHealth <= 0) {
//     //         endTBC("lose");
//     //     }
//     // }

//     // function enemyAttack(brace, enemyDiff) {
//     //     if (brace === "braced") {
//     //         let atkDmg = Math.floor(Math.random() * 10);
//     //         playerHealth -= atkDmg;
//     //     } else {
//     //         let atkDmg = Math.floor(Math.random() * 20) + 10;
//     //         playerHealth -= atkDmg;
//     //     }
//     //     checkResult();
//     // }

//     let enemyHealth = 100;
//     if (enemyDiff === "hard") {
//         enemyHealth = 130;
//     }
//     if (enemyDiff === "easy") {
//         enemyHealth = 80;
//     }
//     let playerHealth = 120;

//     function attack() {
//         const atkDmg = Math.floor(Math.random() * 20) + 10;
//         enemyHealth -= atkDmg;
//         checkResult();
//         enemyAttack();
//     }

//     function dodge() {
//         let dodgeChance = Math.random();
//         if (dodgeChance > 0.3) {
//             enemyAttack();
//         }
//         checkResult();

//     }

//     function brace() {
//         let braceChance = Math.random();
//         if (braceChance < 0.7) {
//             enemyAttack("braced");
//         } else {
//             enemyAttack();
//         }
//         checkResult();

//     }

//     function heal() {
//         let healNmb = Math.floor(Math.random() * 20) + 10;
//         playerHealth += healNmb;
//         if (playerHealth > 100) {
//             playerHealth = 100;
//         }
//         checkResult();
//         enemyAttack();
//     }

//     attackBtn.addEventListener("click", attack);
//     dodgeBtn.addEventListener("click", dodge);
//     braceBtn.addEventListener("click", brace);
//     healBtn.addEventListener("click", heal);
// }


// function magnificusTBC(enemyDiff) {

//     // function endTBC(result) {
//     //     if (result === "win") {
//     //         //GIVE PLAYER RESOURCES
//     //     } else if (result === "lose") {
//     //         //CLOSE PVE OVERLAY
//     //     }
//     //     //CLOSE PVE OVERLAY
//     // }


//     // function checkResult() {
//     //     console.log("Enemy Health,", enemyHealth);
//     //     console.log("Player Health,", playerHealth);
//     //     if (enemyHealth <= 0) {
//     //         endTBC("win");
//     //     }
//     //     if (playerHealth <= 0) {
//     //         endTBC("lose");
//     //     }
//     // }

//     // function enemyAttack(brace, enemyDiff) {
//     //     if (brace === "braced") {
//     //         let atkDmg = Math.floor(Math.random() * 10);
//     //         playerHealth -= atkDmg;
//     //     } else {
//     //         let atkDmg = Math.floor(Math.random() * 20) + 10;
//     //         playerHealth -= atkDmg;
//     //     }
//     //     checkResult();
//     // }

//     let enemyHealth = 100;
//     if (enemyDiff === "hard") {
//         enemyHealth = 130;
//     }
//     if (enemyDiff === "easy") {
//         enemyHealth = 80;
//     }
//     let playerHealth = 100;

//     function attack() {
//         const atkDmg = Math.floor(Math.random() * 20) + 10;
//         enemyHealth -= atkDmg;
//         checkResult();
//         enemyAttack();
//     }

//     function dodge() {
//         let dodgeChance = Math.random();
//         if (dodgeChance > 0.2) {
//             enemyAttack();
//         }
//         checkResult();

//     }

//     function brace() {
//         let braceChance = Math.random();
//         if (braceChance < 0.7) {
//             enemyAttack("braced");
//         } else {
//             enemyAttack();
//         }
//         checkResult();

//     }

//     function heal() {
//         let healNmb = Math.floor(Math.random() * 20) + 10;
//         playerHealth += healNmb;
//         if (playerHealth > 100) {
//             playerHealth = 100;
//         }
//         checkResult();
//         enemyAttack();
//     }

//     attackBtn.addEventListener("click", attack);
//     dodgeBtn.addEventListener("click", dodge);
//     braceBtn.addEventListener("click", brace);
//     healBtn.addEventListener("click", heal);
// }
