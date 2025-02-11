// import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import CharacterSelectScene from './scenes/CharacterSelectScene.js';
import EcommerceScene from './scenes/EcommerceScene.js';
import SceneSelectScene from './scenes/SceneSelectScene.js';
import CultureScene from './scenes/CultureScene.js';
import AgricultureScene from './scenes/AgricultureScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [
        BootScene,
        PreloadScene,
        CharacterSelectScene,
        SceneSelectScene,
        EcommerceScene,
        CultureScene,
        AgricultureScene
    ],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    audio: {
        noAudio: true
    }
};

// 初始化游戏状态
window.gameState = {
    character: null,
    medals: {
        ecommerce: false,
        culture: false,
        agriculture: false
    }
};

// 创建游戏实例
new Phaser.Game(config); 