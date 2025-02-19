import CultureScene from './scenes/CultureScene.js';

const config = {
    // 1. 基础配置
    type: Phaser.AUTO,        // 自动选择 WebGL 或 Canvas
    width: 800,               // 游戏画布宽度
    height: 600,              // 游戏画布高度
    parent: 'game',           // 游戏容器的 DOM ID

    // 2. 场景配置
    scene: [CultureScene],    // 游戏场景列表

    // 3. 物理引擎配置（如果需要）
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },

    // 4. 缩放配置
    scale: {
        mode: Phaser.Scale.FIT,  // 自适应缩放
        autoCenter: Phaser.Scale.CENTER_BOTH  // 居中显示
    }
};

// 创建游戏实例
const game = new Phaser.Game(config); 