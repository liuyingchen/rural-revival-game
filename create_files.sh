#!/bin/bash

echo "开始创建项目文件..."

# 创建目录结构
mkdir -p src/scenes
mkdir -p assets/images/{characters,scenes/{ecommerce,culture,agriculture},ui}
mkdir -p assets/{audio,fonts}

# 创建 package.json
cat > package.json << 'PACKAGE'
{
  "name": "rural-revival-game",
  "version": "1.0.0",
  "description": "countryside",
  "main": "src/config.js",
  "scripts": {
    "clean": "rm -rf .cache dist",
    "start:dev": "live-server --port=3000 --host=localhost --no-browser",
    "build": "parcel build index.html"
  },
  "dependencies": {
    "phaser": "^3.70.0"
  },
  "devDependencies": {
    "live-server": "^1.2.2",
    "parcel-bundler": "^1.12.5"
  },
  "browserslist": [
    "last 2 Chrome versions"
  ]
}
PACKAGE

# 创建 index.html
cat > index.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>乡村振兴游戏</title>
    <link rel="icon" href="data:,">
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f0f0f0;
        }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>
</head>
<body>
    <div id="game"></div>
    <script type="module" src="./src/config.js"></script>
</body>
</html>
HTML

# 创建 config.js
cat > src/config.js << 'CONFIG'
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

window.gameState = {
    character: null,
    medals: {
        ecommerce: false,
        culture: false,
        agriculture: false
    }
};

new Phaser.Game(config);
CONFIG

# 创建 BootScene.js
cat > src/scenes/BootScene.js << 'BOOT'
export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        this.scene.start('PreloadScene');
    }
}
BOOT

# 创建 PreloadScene.js
cat > src/scenes/PreloadScene.js << 'PRELOAD'
export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
        this.loadingProgress = 0;
        this.targetProgress = 0;
    }

    init() {
        console.log('PreloadScene - init');
    }

    preload() {
        console.log('PreloadScene - preload');
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 1);
        graphics.fillRect(0, 0, width, height);
            
        this.add.text(width/2, height/3, '乡村振兴', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(240, 270, 320, 50);

        const progressBar = this.add.graphics();

        const loadingText = this.add.text(width/2, height/2 - 50, '加载中...', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        const percentText = this.add.text(width/2, height/2 + 70, '0%', {
            fontSize: '18px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.time.addEvent({
            delay: 16,
            callback: () => {
                if (this.loadingProgress < this.targetProgress) {
                    this.loadingProgress = Math.min(this.loadingProgress + 0.01, this.targetProgress);
                    percentText.setText(parseInt(this.loadingProgress * 100) + '%');
                    progressBar.clear();
                    progressBar.fillStyle(0xffffff, 1);
                    progressBar.fillRect(250, 280, 300 * this.loadingProgress, 30);
                }
            },
            loop: true
        });

        this.time.addEvent({
            delay: 50,
            callback: () => {
                this.targetProgress = Math.min(this.targetProgress + 0.025, 1);
            },
            repeat: 40
        });

        this.load.image('loading-bg', 'assets/images/common/loading-bg.png');
        this.load.image('main-bg', 'assets/images/common/main-bg.png');
        this.load.image('male', 'assets/images/characters/male.png');
        this.load.image('female', 'assets/images/characters/female.png');
        this.load.image('button', 'assets/images/ui/button.png');
        this.load.image('medal', 'assets/images/ui/medal.png');
        this.load.image('ecommerce-bg', 'assets/images/scenes/ecommerce/background.png');
        this.load.image('package', 'assets/images/scenes/ecommerce/package.png');
        this.load.image('conveyor', 'assets/images/scenes/ecommerce/conveyor.png');

        this.load.on('complete', () => {
            loadingText.setText('加载完成！');
            this.time.delayedCall(500, () => {
                progressBar.destroy();
                progressBox.destroy();
                loadingText.destroy();
                percentText.destroy();
                this.scene.start('CharacterSelectScene');
            });
        });

        this.load.on('loaderror', (file) => {
            console.error('Load error:', file);
            loadingText.setText('加载失败: ' + file.key);
        });
    }

    create() {
        console.log('PreloadScene - create');
    }
}
PRELOAD

# 创建 CharacterSelectScene.js
cat > src/scenes/CharacterSelectScene.js << 'CHARACTER'
export default class CharacterSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CharacterSelectScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width/2, 100, '选择你的角色', {
            fontSize: '32px',
            fill: '#000000'
        }).setOrigin(0.5);

        const maleButton = this.add.image(width/3, height/2, 'male')
            .setInteractive()
            .setScale(0.8);

        const femaleButton = this.add.image(width*2/3, height/2, 'female')
            .setInteractive()
            .setScale(0.8);

        this.add.text(width/3, height/2 + 150, '男性角色', {
            fontSize: '24px',
            fill: '#000000'
        }).setOrigin(0.5);

        this.add.text(width*2/3, height/2 + 150, '女性角色', {
            fontSize: '24px',
            fill: '#000000'
        }).setOrigin(0.5);

        maleButton.on('pointerdown', () => {
            this.selectCharacter('male');
        });

        femaleButton.on('pointerdown', () => {
            this.selectCharacter('female');
        });
    }

    selectCharacter(character) {
        window.gameState.character = character;
        this.scene.start('SceneSelectScene');
    }
}
CHARACTER

# 创建 SceneSelectScene.js
cat > src/scenes/SceneSelectScene.js << 'SCENESELECT'
export default class SceneSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'SceneSelectScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.image(width/2, height/2, 'main-bg')
            .setDisplaySize(width, height);

        this.add.text(width/2, 50, '选择游戏场景', {
            fontSize: '32px',
            fill: '#000000'
        }).setOrigin(0.5);

        const buttonStyle = {
            fontSize: '24px',
            fill: '#ffffff'
        };

        const ecommerceButton = this.add.container(width/2, height/2 - 100);
        const ecommerceBg = this.add.image(0, 0, 'button').setDisplaySize(300, 80);
        const ecommerceText = this.add.text(0, 0, '农村电商', buttonStyle).setOrigin(0.5);
        ecommerceButton.add([ecommerceBg, ecommerceText]);
        ecommerceButton.setSize(300, 80);
        ecommerceButton.setInteractive();

        const cultureButton = this.add.container(width/2, height/2);
        const cultureBg = this.add.image(0, 0, 'button').setDisplaySize(300, 80);
        const cultureText = this.add.text(0, 0, '文化乡村', buttonStyle).setOrigin(0.5);
        cultureButton.add([cultureBg, cultureText]);
        cultureButton.setSize(300, 80);
        cultureButton.setInteractive();

        const agricultureButton = this.add.container(width/2, height/2 + 100);
        const agricultureBg = this.add.image(0, 0, 'button').setDisplaySize(300, 80);
        const agricultureText = this.add.text(0, 0, '现代化农业', buttonStyle).setOrigin(0.5);
        agricultureButton.add([agricultureBg, agricultureText]);
        agricultureButton.setSize(300, 80);
        agricultureButton.setInteractive();

        const backButton = this.add.container(100, 50);
        const backBg = this.add.image(0, 0, 'button').setDisplaySize(120, 40);
        const backText = this.add.text(0, 0, '返回', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        backButton.add([backBg, backText]);
        backButton.setSize(120, 40);
        backButton.setInteractive();

        ecommerceButton.on('pointerdown', () => {
            this.scene.start('EcommerceScene');
        });

        cultureButton.on('pointerdown', () => {
            this.scene.start('CultureScene');
        });

        agricultureButton.on('pointerdown', () => {
            this.scene.start('AgricultureScene');
        });

        backButton.on('pointerdown', () => {
            this.scene.start('CharacterSelectScene');
        });

        [ecommerceButton, cultureButton, agricultureButton, backButton].forEach(button => {
            button.on('pointerover', () => {
                button.first.setScale(1.1);
            });

            button.on('pointerout', () => {
                button.first.setScale(1);
            });
        });

        if (window.gameState.medals.ecommerce) {
            this.add.image(width/2 + 170, height/2 - 100, 'medal').setScale(0.5);
        }
        if (window.gameState.medals.culture) {
            this.add.image(width/2 + 170, height/2, 'medal').setScale(0.5);
        }
        if (window.gameState.medals.agriculture) {
            this.add.image(width/2 + 170, height/2 + 100, 'medal').setScale(0.5);
        }
    }
}
SCENESELECT

# 创建 EcommerceScene.js
cat > src/scenes/EcommerceScene.js << 'ECOMMERCE'
export default class EcommerceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EcommerceScene' });
        this.packageCount = 0;
        this.boxesCompleted = 0;
        this.timeLeft = 60;
        this.isPlaying = false;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.image(width/2, height/2, 'ecommerce-bg')
            .setDisplaySize(width, height);

        this.add.text(width/2, 50, '农村电商', {
            fontSize: '32px',
            fill: '#000000'
        }).setOrigin(0.5);

        this.createConveyor();
        this.packages = this.add.group();
        this.createPackageBox();

        this.timerText = this.add.text(650, 50, `时间: ${this.timeLeft}`, {
            fontSize: '24px',
            fill: '#000'
        });

        this.boxText = this.add.text(650, 90, `完成箱数: ${this.boxesCompleted}`, {
            fontSize: '24px',
            fill: '#000'
        });

        this.packageText = this.add.text(650, 130, `当前包裹: ${this.packageCount}/10`, {
            fontSize: '24px',
            fill: '#000'
        });

        this.showStartPrompt();
    }

    showStartPrompt() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);

        const text = this.add.text(width/2, height/2, 
            '农村电商发展迅速\n帮助村民打包快递\n点击开始游戏', {
            fontSize: '28px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            overlay.destroy();
            text.destroy();
            this.startGame();
        });
    }

    startGame() {
        this.isPlaying = true;

        this.timer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });

        this.packageGenerator = this.time.addEvent({
            delay: 2000,
            callback: this.generatePackage,
            callbackScope: this,
            loop: true
        });
    }

    createConveyor() {
        this.conveyor = this.add.image(400, 500, 'conveyor')
            .setDisplaySize(800, 100);
    }

    createPackageBox() {
        const boxZone = this.add.zone(100, 400, 150, 150)
            .setRectangleDropZone(150, 150);

        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x000000);
        graphics.strokeRect(boxZone.x - boxZone.width/2, boxZone.y - boxZone.height/2, 
            boxZone.width, boxZone.height);
    }

    generatePackage() {
        if (!this.isPlaying) return;

        const packageItem = this.add.image(800, 450, 'package')
            .setScale(0.5)
            .setInteractive();

        this.packages.add(packageItem);

        this.input.setDraggable(packageItem);

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('drop', (pointer, gameObject, dropZone) => {
            gameObject.destroy();
            this.packageCount++;
            this.packageText.setText(`当前包裹: ${this.packageCount}/10`);

            if (this.packageCount >= 10) {
                this.packageCount = 0;
                this.boxesCompleted++;
                this.boxText.setText(`完成箱数: ${this.boxesCompleted}`);
            }
        });
    }

    updateTimer() {
        this.timeLeft--;
        this.timerText.setText(`时间: ${this.timeLeft}`);

        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    endGame() {
        this.isPlaying = false;
        this.packageGenerator.destroy();
        this.timer.destroy();
        this.packages.clear(true, true);
        this.showResultDialog();
    }

    showResultDialog() {
        let reward = '';
        if (this.boxesCompleted >= 10) {
            reward = '金牌';
        } else if (this.boxesCompleted >= 5) {
            reward = '银牌';
        } else {
            reward = '铜牌';
        }

        const content = [
            "游戏结束！",
            "",
            `你总共完成了 ${this.boxesCompleted} 个箱子的打包`,
            `获得${reward}奖励！`,
            "",
            "点击继续进入下一个场景"
        ].join('\n');

        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.7);
        graphics.fillRect(100, 100, 600, 400);

        const text = this.add.text(400, 300, content, {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            window.gameState.medals.ecommerce = true;
            this.scene.start('CultureScene');
        });
    }
}
ECOMMERCE

# 创建 CultureScene.js
cat > src/scenes/CultureScene.js << 'CULTURE'
export default class CultureScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CultureScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width/2, 50, '文化乡村（开发中）', {
            fontSize: '32px',
            fill: '#000000'
        }).setOrigin(0.5);

        const backButton = this.add.container(100, 50);
        const backBg = this.add.image(0, 0, 'button').setDisplaySize(120, 40);
        const backText = this.add.text(0, 0, '返回', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        backButton.add([backBg, backText]);
        backButton.setSize(120, 40);
        backButton.setInteractive();

        backButton.on('pointerdown', () => {
            this.scene.start('SceneSelectScene');
        });
    }
}
CULTURE

# 创建 AgricultureScene.js
cat > src/scenes/AgricultureScene.js << 'AGRICULTURE'
export default class AgricultureScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AgricultureScene' });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.text(width/2, 50, '现代化农业（开发中）', {
            fontSize: '32px',
            fill: '#000000'
        }).setOrigin(0.5);

        const backButton = this.add.container(100, 50);
        const backBg = this.add.image(0, 0, 'button').setDisplaySize(120, 40);
        const backText = this.add.text(0, 0, '返回', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        backButton.add([backBg, backText]);
        backButton.setSize(120, 40);
        backButton.setInteractive();

        backButton.on('pointerdown', () => {
            this.scene.start('SceneSelectScene');
        });
    }
}
AGRICULTURE

# 创建 .gitignore
cat > .gitignore << 'GITIGNORE'
# Dependencies
node_modules/
package-lock.json

# Build files
dist/
.cache/

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db
GITIGNORE

echo "文件创建完成！"
