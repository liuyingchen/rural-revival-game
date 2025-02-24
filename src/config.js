//import Phaser from 'phaser';
console.log('开始加载配置...');

// 使用异步函数来初始化游戏
async function initGame() {
    // 动态导入所有场景
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
        scale: {
            mode: Phaser.Scale.RESIZE,
            parent: 'game',
            width: '100%',
            height: '100%',
            min: {
                width: 800,
                height: 600
            },
            max: {
                width: 1920,
                height: 1080
            }
        },
        backgroundColor: '#000000',
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
        }
    };

    // 添加窗口大小变化监听
    window.addEventListener('resize', () => {
        if (window.game) {
            window.game.scale.resize(window.innerWidth, window.innerHeight);
        }
    });

    // 创建全局游戏状态
    window.gameState = {
        character: null
    };

    console.log('创建游戏实例...');
    window.game = new Phaser.Game(config);
    console.log('游戏实例创建完成');
}

// 启动游戏
initGame().catch(console.error);
