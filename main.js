class Ability {
  constructor(name, cooldown, amount, target, effect) {
    this.amount = amount;
    this.maxAmount = amount;
    this.cooldown = cooldown;
    this.effect = effect;
    this.maxCooldown = cooldown;
    this.name = name;
    this.target = target;
  }

  doTick() {
    this.cooldown = Math.max(0, this.cooldown - 1);
  }

  use() {
    if (this.amount > 0 && this.cooldown === 0) {
      this.amount--;

      return true;
    }

    return false;
  }

  getLine() {
    return `${this.name} <small>&times; ${this.amount < Infinity ? this.amount : '&infin;'}${this.maxCooldown !== undefined ? ` Cooldown: ${this.cooldown}/${this.maxCooldown}` : ''}</small>`;
  }
}

class Pokemon {
  constructor(name, hp, id, abilities) {
    this.abilities = abilities;
    this.curHp = hp;
    this.hpBar = null;
    this.hpText = null;
    this.id = id;
    this.lvl = 1;
    this.maxHp = hp;
    this.name = name;
  }

  useAbility(abilityIndex, opposite) {
    const ability = this.abilities[abilityIndex];

    if (ability.use) {
      if (ability.target === 'enemy') {
        if (ability.effect.damage !== undefined) {
          opposite.receiveDamage(ability.effect.damage);
        } else if (ability.effect.damageMin !== undefined && ability.effect.damageMax !== undefined) {
          opposite.receiveDamage(ability.effect.damageMin + Math.floor(Math.random() * (ability.effect.damageMax - ability.effect.damageMin)));
        }
      } else if (ability.target === 'self') {
        // TODO: implement heal, protect, rally, etc
      } else if (ability.target === 'ally') {
        // TODO: implement team fight
      }
    } else {
      // TODO: Catch cheaters
    }

    ability.cooldown = ability.maxCooldown;
  }

  receiveDamage(damage) {
    this.curHp = Math.max(0, this.curHp - damage);
  }

  tickAbilities(exceptIndex) {
    this.abilities.forEach(function (ability, index) {
      if (index !== exceptIndex) {
        ability.doTick();
      }
    });
  }

  reset() {
    this.curHp = this.maxHp;

    this.abilities.forEach(function (ability) {
      ability.amount = ability.maxAmount;
      ability.cooldown = ability.maxCooldown;
    });
  }

  getHpStatLine() {
    return `${this.curHp} / ${this.maxHp}`;
  }

  getLvlStatLine() {
    return `Lvl. ${this.lvl}`;
  }

  getImageLink() {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${this.id}.png`;
  }

  renderInit(slotElement) {
    slotElement.innerHTML = `
      <span class="lvl">${this.getLvlStatLine()}</span>
      <img
        alt="${this.name}"
        class="sprite"
        src="${this.getImageLink()}"
      >
        <div class="details">
          <h2 class="name">${this.name}</h2>
          <div class="hp">
            <div class="bar">
              <div class="health js-health-progressbar" style="width: 100%;"></div>
            </div>
            <span class="text js-health-text">${this.getHpStatLine()}</span>
          </div>
        </div>
    `;

    this.hpBar = slotElement.querySelector('.js-health-progressbar');
    this.hpText = slotElement.querySelector('.js-health-text');
  }

  updateHp() {
    this.hpBar.style.width = `${this.curHp / this.maxHp * 100}%`;
    this.hpText.innerHTML = this.getHpStatLine();
  }
}

class Battle {
  constructor(player, enemy, start) {
    this.player = player;
    this.enemy = enemy;
    this.start = start;
    this.playerSlot = document.querySelector('.js-player-pokemon');
    this.enemySlot = document.querySelector('.js-enemy-pokemon');
    this.actionsBlock = document.querySelector('.js-actions-block');

    this.resetBattleground();
  }

  doRound(playerAbilityIndex) {
    // TODO: hardcoded cpu choice, implement AI here
    const enemyAbilityIndex = 0;

    this.player.useAbility(playerAbilityIndex, this.enemy);
    this.enemy.useAbility(enemyAbilityIndex, this.player);

    this.player.tickAbilities(playerAbilityIndex);
    this.enemy.tickAbilities(enemyAbilityIndex);

    this.updateBattleground();

    const result = this.getBattleResult();

    if (result.isFinished) {
      this.disableActions();

      alert(result.isDraw ? 'Draw!' : `${result.winner} Wins!`);
    }
  }

  initBattleground() {
    this.player.renderInit(this.playerSlot);
    this.enemy.renderInit(this.enemySlot);
    this.renderActions();
  }

  renderActions() {
    this.actionsBlock.innerHTML = `
      ${
        this.player.abilities.map(function (ability, index) {
          return `
              <button class="button" id="js-use-ability-${index}">${ability.getLine()}</button>
          `;
        }).join('')
      }
    `;

    this.player.abilities.forEach(function (ability, index) {
      const button = this.actionsBlock.querySelector(`#js-use-ability-${index}`);

      button.addEventListener('click', function () {
        this.doRound(index);
      }.bind(this));
    }.bind(this));

    this.updateActions();
  }

  updateActions() {
    this.player.abilities.forEach(function (ability, index) {
      const button = this.actionsBlock.querySelector(`#js-use-ability-${index}`);

      button.innerHTML = ability.getLine();
      button.disabled = ability.cooldown > 0;
    }.bind(this));
  }

  disableActions() {
    this.actionsBlock.innerHTML = `
      <button class="button js-start-button">Restart battle</button>
    `;
  }

  resetBattleground() {
    this.player.reset();
    this.enemy.reset();
    this.initBattleground();
  }

  updateBattleground() {
    this.player.updateHp();
    this.enemy.updateHp();
    this.updateActions();
  }

  getBattleResult() {
    const result = {
      isFinished: this.player.curHp <= 0 || this.enemy.curHp <= 0
    };

    if (result.isFinished) {
      if (this.player.curHp === 0 && this.enemy.curHp === 0) {
        result.isDraw = true;
      } else {
        result.winner = this.player.curHp > 0 ? this.player.name : this.enemy.name;
        result.loser = this.player.curHp <= 0 ? this.player.name : this.enemy.name;
      }
    }

    return result;
  }
}



const thunderJolt = new Ability('Thunder Jolt', undefined, Infinity, 'enemy', {
  damageMin: 1,
  damageMax: 5
});
const pickachuuu = new Ability('P-I-K-A-C-H-U-U-U', 3, Infinity, 'enemy', {
  damage: 10
});
const pikachu = new Pokemon('Pikachu', 80, 25, [thunderJolt, pickachuuu]);

const fireStrike = new Ability('Fire Strike', undefined, Infinity, 'enemy', {
  damageMin: 2,
  damageMax: 6
});
const charmander = new Pokemon('Charmander', 80, 4, [fireStrike]);

function startBattle(event) {
  if (event.target.classList.contains('js-start-button')) {
    new Battle(pikachu, charmander);
  }
}

document.addEventListener('click', startBattle);