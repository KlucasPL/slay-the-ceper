import { describe, it, expect } from 'vitest';
import { GameState } from '../../src/state/GameState.js';
import { characters } from '../../src/data/characters.js';
import { enemyLibrary } from '../../src/data/enemies.js';
import * as nav from '../../src/state/NavigationState.js';

describe('NavigationState', () => {
  describe('getMapNodeMeta', () => {
    it('returns correct metadata for all node types', () => {
      const nodeTypes = {
        fight: { label: 'Bitka', emoji: '⚔️' },
        elite: { label: 'Elita', emoji: '🗡️' },
        shop: { label: 'Jarmark', emoji: '🛖' },
        treasure: { label: 'Skarb', emoji: '🎁' },
        event: { label: 'Wydarzenie', emoji: '❓' },
        campfire: { label: 'Watra', emoji: '🔥' },
        boss: { label: 'Herszt', emoji: '👑' },
        maryna: { label: 'Maryna', emoji: '👵' },
      };

      Object.entries(nodeTypes).forEach(([type, expected]) => {
        const meta = nav.getMapNodeMeta(type);
        expect(meta.label).toBe(expected.label);
        expect(meta.emoji).toBe(expected.emoji);
      });
    });

    it('returns default metadata for unknown node type', () => {
      const meta = nav.getMapNodeMeta('invalid_type');
      expect(meta.label).toBe('Pole');
      expect(meta.emoji).toBe('•');
    });
  });

  describe('getReachableNodes', () => {
    it('returns connections from current node', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      const currentNode = nav.getCurrentMapNode(s);
      if (currentNode) {
        const reachable = nav.getReachableNodes(s);
        expect(reachable).toEqual(currentNode.connections);
      }
    });

    it('returns empty array when current node is null', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.currentLevel = 999;
      s.currentNodeIndex = 999;
      const reachable = nav.getReachableNodes(s);
      expect(reachable).toEqual([]);
    });

    it('returns a copy of connections, not reference', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      const reachable = nav.getReachableNodes(s);
      const copy = [...reachable];
      reachable.push(9999);
      const reachable2 = nav.getReachableNodes(s);
      expect(reachable2).toEqual(copy);
    });
  });

  describe('canTravelTo', () => {
    it('denies travel before first battle started', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.hasStartedFirstBattle = false;
      expect(nav.canTravelTo(s, 1, 0)).toBe(false);
    });

    it('denies travel to non-adjacent level', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.hasStartedFirstBattle = true;
      expect(nav.canTravelTo(s, 5, 0)).toBe(false);
    });

    it('denies travel to non-existent level', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.hasStartedFirstBattle = true;
      expect(nav.canTravelTo(s, 999, 0)).toBe(false);
    });

    it('denies travel to non-existent node index', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.hasStartedFirstBattle = true;
      expect(nav.canTravelTo(s, 1, 999)).toBe(false);
    });

    it('denies travel to unconnected node', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.hasStartedFirstBattle = true;
      s.currentLevel = 0;
      s.currentNodeIndex = 1;
      const currentNode = nav.getCurrentMapNode(s);
      if (currentNode && currentNode.connections.length > 0 && s.map[1]) {
        const allIndices = Array.from({ length: s.map[1].length }, (_, i) => i);
        const unconnectedIndices = allIndices.filter((i) => !currentNode.connections.includes(i));
        if (unconnectedIndices.length > 0) {
          expect(nav.canTravelTo(s, 1, unconnectedIndices[0])).toBe(false);
        }
      }
    });

    it('allows travel to connected node at next level', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.hasStartedFirstBattle = true;
      const currentNode = nav.getCurrentMapNode(s);
      if (currentNode && currentNode.connections.length > 0) {
        const targetNodeIndex = currentNode.connections[0];
        expect(nav.canTravelTo(s, 1, targetNodeIndex)).toBe(true);
      }
    });
  });

  describe('travelTo', () => {
    it('returns null when travel is not allowed', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.hasStartedFirstBattle = false;
      expect(nav.travelTo(s, 1, 0)).toBeNull();
    });

    it('updates current level and node index on valid travel', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.hasStartedFirstBattle = true;
      const currentNode = nav.getCurrentMapNode(s);
      if (currentNode && currentNode.connections.length > 0) {
        const targetNodeIndex = currentNode.connections[0];
        nav.travelTo(s, 1, targetNodeIndex);
        expect(s.currentLevel).toBe(1);
        expect(s.currentNodeIndex).toBe(targetNodeIndex);
      }
    });

    it('updates currentNode coordinates on valid travel', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.hasStartedFirstBattle = true;
      const currentNode = nav.getCurrentMapNode(s);
      if (currentNode && currentNode.connections.length > 0) {
        const targetNodeIndex = currentNode.connections[0];
        nav.travelTo(s, 1, targetNodeIndex);
        expect(s.currentNode.x).toBe(targetNodeIndex);
        expect(s.currentNode.y).toBe(1);
      }
    });

    it('updates maxFloorReached on travel', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.hasStartedFirstBattle = true;
      const previousMax = s.maxFloorReached;
      const currentNode = nav.getCurrentMapNode(s);
      if (currentNode && currentNode.connections.length > 0) {
        const targetNodeIndex = currentNode.connections[0];
        nav.travelTo(s, 1, targetNodeIndex);
        expect(s.maxFloorReached).toBeGreaterThanOrEqual(previousMax);
      }
    });

    it('returns the new map node on valid travel', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.hasStartedFirstBattle = true;
      const currentNode = nav.getCurrentMapNode(s);
      if (currentNode && currentNode.connections.length > 0) {
        const targetNodeIndex = currentNode.connections[0];
        const newNode = nav.travelTo(s, 1, targetNodeIndex);
        expect(newNode).not.toBeNull();
        expect(newNode?.x).toBe(targetNodeIndex);
      }
    });
  });

  describe('getCurrentMapNode', () => {
    it('returns valid node at starting position', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      const node = nav.getCurrentMapNode(s);
      expect(node).not.toBeNull();
      expect(node?.x).toBeDefined();
      expect(node?.y).toBeDefined();
    });

    it('returns null for out-of-bounds level', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.currentLevel = 999;
      const node = nav.getCurrentMapNode(s);
      expect(node).toBeNull();
    });

    it('returns null for out-of-bounds node index', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.currentNodeIndex = 999;
      const node = nav.getCurrentMapNode(s);
      expect(node).toBeNull();
    });
  });

  describe('getCurrentAct', () => {
    it('returns Act I for early levels', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.currentLevel = 0;
      expect(nav.getCurrentAct(s)).toBe('I');
    });

    it('returns Act III for late levels', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      const mapLength = s.map.length;
      s.currentLevel = mapLength - 1;
      expect(nav.getCurrentAct(s)).toBe('III');
    });

    it('returns Act I for first third of map', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      const mapLength = s.map.length;
      const firstThirdLevel = Math.floor(mapLength / 6);
      s.currentLevel = firstThirdLevel;
      expect(nav.getCurrentAct(s)).toBe('I');
    });

    it('returns Act II for second third of map', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      const mapLength = s.map.length;
      const secondThirdLevel = Math.floor(mapLength / 3 + mapLength / 6);
      s.currentLevel = secondThirdLevel;
      expect(nav.getCurrentAct(s)).toBe('II');
    });
  });

  describe('applyJumpToBossShortcut', () => {
    it('returns false when jumpToBoss is false', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.jumpToBoss = false;
      expect(nav.applyJumpToBossShortcut(s)).toBe(false);
    });

    it('returns false when campfire node does not exist', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.jumpToBoss = true;
      s.map = [];
      expect(nav.applyJumpToBossShortcut(s)).toBe(false);
    });

    it('jumps to campfire level when shortcut is enabled', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.jumpToBoss = true;
      s.hasStartedFirstBattle = true;
      const campfireLevel = s.map.length - 2;
      const result = nav.applyJumpToBossShortcut(s);
      if (s.map[campfireLevel]?.[1]) {
        expect(result).toBe(true);
        expect(s.currentLevel).toBe(campfireLevel);
        expect(s.currentNodeIndex).toBe(1);
      }
    });

    it('resets jumpToBoss flag after jump', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.jumpToBoss = true;
      s.hasStartedFirstBattle = true;
      const campfireLevel = s.map.length - 2;
      if (s.map[campfireLevel]?.[1]) {
        nav.applyJumpToBossShortcut(s);
        expect(s.jumpToBoss).toBe(false);
      }
    });

    it('sets hasStartedFirstBattle to true', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.jumpToBoss = true;
      s.hasStartedFirstBattle = false;
      const campfireLevel = s.map.length - 2;
      if (s.map[campfireLevel]?.[1]) {
        nav.applyJumpToBossShortcut(s);
        expect(s.hasStartedFirstBattle).toBe(true);
      }
    });

    it('updates maxFloorReached', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.jumpToBoss = true;
      s.hasStartedFirstBattle = true;
      const previousMax = s.maxFloorReached;
      const campfireLevel = s.map.length - 2;
      if (s.map[campfireLevel]?.[1]) {
        nav.applyJumpToBossShortcut(s);
        expect(s.maxFloorReached).toBeGreaterThanOrEqual(previousMax);
      }
    });
  });

  describe('setCurrentWeatherFromNode', () => {
    it('sets weather from current node', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      const currentNode = nav.getCurrentMapNode(s);
      if (currentNode) {
        nav.setCurrentWeatherFromNode(s);
        expect(s.currentWeather).toBe(currentNode.weather);
      }
    });

    it('defaults to clear weather when no node exists', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      s.currentLevel = 999;
      s.currentNodeIndex = 999;
      nav.setCurrentWeatherFromNode(s);
      expect(s.currentWeather).toBe('clear');
    });

    it('updates weather when navigating to node with different weather', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      const origWeather = s.currentWeather;
      for (let level = 0; level < s.map.length; level++) {
        for (let nodeIdx = 0; nodeIdx < s.map[level].length; nodeIdx++) {
          const node = s.map[level][nodeIdx];
          if (node && node.weather !== origWeather) {
            s.currentLevel = level;
            s.currentNodeIndex = nodeIdx;
            nav.setCurrentWeatherFromNode(s);
            expect(s.currentWeather).toBe(node.weather);
            return;
          }
        }
      }
    });

    it('does not change weather when already at same weather node', () => {
      const s = new GameState(characters.jedrek, enemyLibrary.zagubiony_ceper);
      const currentNode = nav.getCurrentMapNode(s);
      const originalWeather = currentNode?.weather || 'clear';
      s.currentWeather = originalWeather;
      nav.setCurrentWeatherFromNode(s);
      expect(s.currentWeather).toBe(originalWeather);
    });
  });
});
