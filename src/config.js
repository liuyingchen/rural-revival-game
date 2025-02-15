// import Phaser from 'phaser';
console.log('开始加载配置...');

// 修改导入方式
const BootScene = (await import('./scenes/BootScene.js')).default;
const PreloadScene = (await import('./scenes/PreloadScene.js')).default;
const CharacterSelectScene = (await import('./scenes/CharacterSelectScene.js')).default;
const SceneSelectScene = (await import('./scenes/SceneSelectScene.js')).default;
const EcommerceScene = (await import('./scenes/EcommerceScene.js')).default;
const CultureScene = (await import('./scenes/CultureScene.js')).default;
const AgricultureScene = (await import('./scenes/AgricultureScene.js')).default;
const EndScene = (await import('./scenes/EndScene.js')).default;

console.log('场景加载完成');

const config = {
    type: Phaser.AUTO,
    width: 1308,  // 修改为新图片的宽度
    height: 736,  // 修改为新图片的高度
    parent: 'game',
    scale: {
        mode: Phaser.Scale.FIT,  // 自动适配屏幕
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [
        BootScene,
        PreloadScene,
        CharacterSelectScene,
        SceneSelectScene,
        EcommerceScene,
        CultureScene,
        AgricultureScene,
        EndScene
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

console.log('创建游戏实例...');
new Phaser.Game(config);
console.log('游戏实例创建完成');

window.gameState = {
    character: null,
    medals: {
        ecommerce: false,
        culture: false,
        agriculture: false
    }
};
