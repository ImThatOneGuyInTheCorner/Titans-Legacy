import Player from "./player.js";

class Battle{
    constructor(diff,player){
        this.diff = diff;
        this.player = player;
        this.enemyHP = 80 + (this.diff == "hard" ? 70 : this.diff == "medium" ? 20 : 0);
        this.enemymaxHP = this.enemyHP;
        this.bracing = false;
        this.dodge = false;
    }
    induceDamage(dmg,toPlayer){
        if(toPlayer){
            console.log(`Induced ${dmg} damage to player`)
            this.player.hp -= dmg;
        }else{
            console.log(`Induced ${dmg} damage to enemy`)
            this.enemyHP -= dmg;
        }
    }
    didPlayerWin(){
        return this.enemyHP <= 0;
    }
    didEnemyWin(){
        return this.enemyHP > 0 && this.player.hp <= 0;
    }
    stepTurn(){
        if(this.didPlayerWin()){
            console.log("plr won")
            return
        }
        if(this.didEnemyWin()){
            console.warn("player dead")
            return
        }
        console.log(`plr ${this.bracing ? "is" : "is not"} bracing`)
        let damage = this.bracing == true ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 20) + 10
        let dodgeChance = Math.random();
        if (dodgeChance > 0.3*testPlr.dodgeChance && this.dodge == true) {
            this.induceDamage(damage,true);

        }else if(this.dodge == false){
            this.induceDamage(damage,true);
        }else{
            console.log(`plr dodged ${damage} damage`)
        }
        this.bracing = false;
        this.dodge = false;
        console.log(`plr: ${this.player.hp}/${this.player.maxhp}`)
        console.log(`enemy: ${this.enemyHP}/${this.enemymaxHP}`)
        console.log("<|-|>".repeat(25))
        if(this.didEnemyWin()){
            console.warn("player dead")
            return
        }
    }
}

let testPlr = new Player();
testPlr.hp = 100;
testPlr.maxhp = 100;
testPlr.dmgModifier = 1.5;
testPlr.dodgeChance = 1.2;

let fight = new Battle("easy",testPlr);

let moveFunctions = {
    brace:()=>{
        fight.bracing = true;
        fight.stepTurn();
    },
    heal:(plr)=>{
        plr.hp = Math.min(plr.hp+10,plr.maxhp);
        fight.stepTurn();
    },
    dodge:(plr)=>{
        fight.stepTurn();
    },
    attack:(plr)=>{
        let dmg = Math.floor(Math.random() * 20)*plr.dmgModifier + 10;
        fight.induceDamage(dmg,false);
        fight.stepTurn();
    }
}
function doMove(btn){
    btn.addEventListener("click",()=>{
        let move = btn.id.substring(6).slice(0,-3).toLowerCase();
        moveFunctions[move](fight.player)
    }) 
}
document.addEventListener("DOMContentLoaded",()=>{
    let buttons = document.querySelectorAll("section .btn");
    for(const btn of buttons){
        doMove(btn);
    }
})