// constants
const DIRECTIONS = {
  BACKWARD: 'backward',
  FORWARD: 'forward'
};

const FEELINGS = {
  CAPTIVE: 'captive',
  EMPTY: 'empty',
  ENEMY: 'enemy',
  WALL: 'wall'
};

const FACING = {
  RIGHT: 'right',
  LEFT: 'left'
};

// utils
const canWalkInDirection = (warrior, direction = DIRECTIONS.FORWARD) => {
  const feeling = getFeel(warrior, direction);
  if (feeling === FEELINGS.EMPTY) return true;
  return false;
};

const getDirections = () => Object.keys(DIRECTIONS).map(key => DIRECTIONS[key]);

const getFeel = (warrior, direction = DIRECTIONS.FORWARD) => {
  const feel = warrior.feel(direction);
  if (feel.isEmpty()) return FEELINGS.EMPTY;
  if (feel.isWall()) return FEELINGS.WALL;

  const unit = feel.getUnit();
  if (unit.isBound()) return FEELINGS.CAPTIVE;
  if (unit.isEnemy()) return FEELINGS.ENEMY;
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
  warrior.think(look);
};

const getLooks = warrior => {
  const directions = getDirections();
  directions.forEach(direction => getLook(warrior, direction));
};

const getNearestFeeling = (feelings, feeling) => {
  return feelings.find(f => f.feel === feeling);
};

const getOppositeDirection = direction => {
  switch (direction) {
    case DIRECTIONS.BACKWARD:
      return DIRECTIONS.FORWARD;
    case DIRECTIONS.FORWARD:
      return DIRECTIONS.BACKWARD;
  }
};

// eslint-disable-next-line no-unused-vars
class Player {
  constructor() {
    this.direction = DIRECTIONS.BACKWARD;
    this.facing = FACING.RIGHT;
    this.health = null;
    this.isResting = false;
  }

  hasMaxHealth(warrior) {
    return this.health === warrior.maxHealth();
  }

  init(warrior) {
    if (!warrior) return;
    if (typeof this.health !== 'number') this.health = warrior.health();
  }

  isLosingHealth(warrior) {
    return warrior.health() < this.health;
  }

  needsRest(warrior) {
    return this.health < warrior.maxHealth() * (3 / 4);
  }

  getActionAndDirection(warrior) {
    const hasMaxHealth = this.hasMaxHealth(warrior);
    const isLosingHealth = this.isLosingHealth(warrior);

    if (this.isResting && !hasMaxHealth && !isLosingHealth) {
      return { action: warrior.rest };
    }

    const feelings = getFeelings(warrior);
    const enemyNear = getNearestFeeling(feelings, FEELINGS.ENEMY);
    const needsRest = this.needsRest(warrior);

    if (enemyNear) {
      const { direction: directionOfEnemy } = enemyNear;
      const oppositeDirectionOfEnemy = getOppositeDirection(directionOfEnemy);
      const canWalkAway = canWalkInDirection(warrior, oppositeDirectionOfEnemy);

      if (needsRest && canWalkAway) {
        return { action: warrior.walk, direction: oppositeDirectionOfEnemy };
      }

      return { action: warrior.attack, direction: directionOfEnemy };
    }

    if (needsRest) {
      if (!isLosingHealth) return { action: warrior.rest };

      return {
        action: warrior.walk,
        direction: this.direction
      };
    }

    const captiveNear = getNearestFeeling(feelings, FEELINGS.CAPTIVE);
    if (captiveNear) {
      const { direction } = captiveNear;
      return { action: warrior.rescue, direction };
    }

    const wallNear = getNearestFeeling(feelings, FEELINGS.WALL);
    if (wallNear) {
      const { direction: directionOfWall } = wallNear;

      if (directionOfWall === DIRECTIONS.FORWARD) {
        const direction = getOppositeDirection(directionOfWall);
        this.facing = direction;

        return { action: warrior.pivot };
      }
    }

    return { action: warrior.walk, direction: this.direction };
  }

  playTurn(warrior) {
    this.init(warrior);

    const { action, direction } = this.getActionAndDirection(warrior);
    action(direction);

    this.direction = direction;
    this.facing = this.health = warrior.health();
    this.isResting = action === warrior.rest;
  }
}
