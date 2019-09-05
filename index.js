// constants
const DIRECTIONS = {
  BACKWARD: 'backward',
  FORWARD: 'forward'
};

const TILES = {
  CAPTIVE: 'captive',
  EMPTY: 'empty',
  ENEMY: 'enemy',
  STAIRS: 'stairs',
  WALL: 'wall'
};

// utils
const getDirections = () => Object.keys(DIRECTIONS).map(key => DIRECTIONS[key]);

const getFeel = (warrior, direction = DIRECTIONS.FORWARD) => {
  const feel = warrior.feel(direction);

  const unit = feel.getUnit();
  if (unit) {
    if (unit.isBound()) return TILES.CAPTIVE;
    if (unit.isEnemy()) return TILES.ENEMY;
  }

  if (feel.isEmpty()) return TILES.EMPTY;
  if (feel.isWall()) return TILES.WALL;
};

const getFeelings = warrior => {
  const directions = getDirections();
  return directions.map(direction => ({
    direction,
    feel: getFeel(warrior, direction)
  }));
};

const getLook = (warrior, direction = DIRECTIONS.FORWARD) => {
  const look = warrior.look(direction);
  const units = look.map(tile => getUnitFromTile(tile));

  return units;
};

const getLooks = warrior => {
  const directions = getDirections();
  return directions.map(direction => ({
    direction,
    units: getLook(warrior, direction)
  }));
};

const getNearestFeeling = (warrior, feeling) => {
  const feelings = getFeelings(warrior);
  return feelings.find(f => f.feel === feeling) || null;
};

const getNearestLook = (warrior, tile) => {
  const looks = getLooks(warrior);
  return looks.find(look => look.units.includes(tile)) || null;
};

const getUnitFromTile = tile => {
  const isUnit = tile.isUnit();
  if (isUnit) {
    const unit = tile.getUnit();

    if (unit.isBound()) return TILES.CAPTIVE;
    if (unit.isEnemy()) return TILES.ENEMY;
  }

  if (tile.isEmpty()) return TILES.EMPTY;
  if (tile.isStairs()) return TILES.STAIRS;
  if (tile.isWall()) return TILES.WALL;
};

// eslint-disable-next-line no-unused-vars
class Player {
  constructor() {
    this.canAttackHealthThreshold = null;
    this.health = null;
    this.shouldRetreatHealthThreshold = null;
  }

  getMaxHealth(warrior) {
    return warrior.maxHealth();
  }

  getActionAndDirection(warrior) {
    const isUnderAttack = this.isUnderAttack(warrior);
    if (isUnderAttack) {
      const shouldRetreat = this.shouldRetreat(warrior);
      if (shouldRetreat) {
        return { action: warrior.walk, direction: DIRECTIONS.BACKWARD };
      }

      return this.handleEnemies(warrior);
    }

    const needsRest = this.needsRest(warrior);
    if (needsRest) return { action: warrior.rest };

    const seeEnemy = getNearestLook(warrior, TILES.ENEMY);
    if (seeEnemy) return this.handleEnemies(warrior);

    const seeCaptive = getNearestLook(warrior, TILES.CAPTIVE);
    if (seeCaptive) return this.handleCaptives(warrior);

    const feelWall = getNearestFeeling(warrior, TILES.WALL);

    if (feelWall) {
      const { direction } = feelWall;
      const facingWall = direction === DIRECTIONS.FORWARD;
      if (facingWall) return { action: warrior.pivot };
    }

    return { action: warrior.walk, direction: DIRECTIONS.FORWARD };
  }

  handleCaptives(warrior) {
    const feelCaptive = getNearestFeeling(warrior, TILES.CAPTIVE);
    if (feelCaptive) {
      const { direction } = feelCaptive;
      if (direction === DIRECTIONS.BACKWARD) return { action: warrior.pivot };

      return { action: warrior.rescue, direction };
    }

    const seeCaptive = getNearestLook(warrior, TILES.CAPTIVE);
    if (seeCaptive) {
      const { direction } = seeCaptive;
      return { action: warrior.walk, direction };
    }
  }

  handleEnemies(warrior) {
    const feelEnemy = getNearestFeeling(warrior, TILES.ENEMY);
    if (feelEnemy) {
      const { direction } = feelEnemy;
      if (direction === DIRECTIONS.BACKWARD) return { action: warrior.pivot };

      return { action: warrior.attack, direction };
    }

    const seeEnemy = getNearestLook(warrior, TILES.ENEMY);
    if (seeEnemy) {
      const { direction } = seeEnemy;
      return { action: warrior.shoot, direction };
    }
  }

  init(warrior) {
    if (!warrior) return;

    const maxHealth = this.getMaxHealth(warrior);

    if (typeof this.canAttackHealthThreshold !== 'number')
      this.canAttackHealthThreshold = maxHealth * (3 / 4);
    if (typeof this.health !== 'number') this.health = warrior.health();
    if (typeof this.shouldRetreatHealthThreshold !== 'number')
      this.shouldRetreatHealthThreshold = maxHealth / 2;
  }

  isUnderAttack(warrior) {
    return warrior.health() < this.health;
  }

  needsRest(warrior) {
    return warrior.health() < this.canAttackHealthThreshold;
  }

  playTurn(warrior) {
    this.init(warrior);

    const { action, direction } = this.getActionAndDirection(warrior);
    action(direction);

    this.health = warrior.health();
  }

  shouldRetreat(warrior) {
    return warrior.health() < this.shouldRetreatHealthThreshold;
  }
}
