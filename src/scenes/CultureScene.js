export default class CultureScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CultureScene' });
        this.pieces = [];  // 存储4个待拼接的碎片
        this.isPlaying = false;
        this.completedPieces = 0;  // 已完成的碎片数量
        this.gameStartTime = 0;
        this.medalTimes = {
            gold: 15,    // 15秒内完成获得金牌
            silver: 25,  // 25秒内完成获得银牌
            bronze: 35   // 35秒内完成获得铜牌
        };
    }

    preload() {
        // 加载背景图
        this.load.image('culture-background', 'assets/images/scenes/culture/background.png');
        this.load.image('puzzle-total', 'assets/images/scenes/culture/total.png');
        this.load.image('puzzle-other', 'assets/images/scenes/culture/other.png');
        this.load.image('piece-11', 'assets/images/scenes/culture/11.png');
        this.load.image('piece-12', 'assets/images/scenes/culture/12.png');
        this.load.image('piece-21', 'assets/images/scenes/culture/21.png');
        this.load.image('piece-22', 'assets/images/scenes/culture/22.png');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 添加背景图
        this.add.image(width/2, height/2, 'culture-background')
            .setDisplaySize(width, height);

        // 设置基础拼图尺寸
        const puzzleWidth = 400;
        const puzzleHeight = 300;

        // 右侧：展示完整图片
        const totalImage = this.add.image(width * 0.75, height/2, 'puzzle-total')
            .setDisplaySize(puzzleWidth, puzzleHeight);

        // 左侧：拼图区域 - 基础图片
        const baseImage = this.add.image(width * 0.25, height/2, 'puzzle-other')
            .setDisplaySize(puzzleWidth, puzzleHeight);

        // 调整碎片尺寸（进一步缩小）
        const pieceWidth = 97;   // 从100减小到70
        const pieceHeight = 56;  // 从75减小到50

        // 调整碎片的目标位置
        const pieceConfigs = [
            // 左上
            { 
                key: 'piece-11', 
                targetX: width * 0.25 - 100,
                targetY: height/2 - 75,
                displayWidth: pieceWidth,
                displayHeight: pieceHeight
            },
            // 右上
            { 
                key: 'piece-12', 
                targetX: width * 0.25 + 100,
                targetY: height/2 - 75,
                displayWidth: pieceWidth,
                displayHeight: pieceHeight
            },
            // 左下
            { 
                key: 'piece-21', 
                targetX: width * 0.25 - 100,
                targetY: height/2 + 75,
                displayWidth: pieceWidth,
                displayHeight: pieceHeight
            },
            // 右下
            { 
                key: 'piece-22', 
                targetX: width * 0.25 + 100,
                targetY: height/2 + 75,
                displayWidth: pieceWidth,
                displayHeight: pieceHeight
            }
        ];

        // 随机分布碎片的初始位置
        pieceConfigs.forEach(config => {
            const angle = Math.random() * Math.PI * 2;
            const distance = Phaser.Math.Between(150, 200);
            const randomX = width * 0.25 + Math.cos(angle) * distance;
            const randomY = height/2 + Math.sin(angle) * distance;
            
            const piece = this.add.image(randomX, randomY, config.key)
                .setDisplaySize(config.displayWidth, config.displayHeight)  // 使用displaySize而不是scale
                .setInteractive({ draggable: true });

            piece.targetX = config.targetX;
            piece.targetY = config.targetY;

            // 拖拽相关事件
            piece.on('dragstart', (pointer) => {
                this.children.bringToTop(piece);
                piece.setDisplaySize(
                    config.displayWidth * 1.02,  // 只放大2%
                    config.displayHeight * 1.02
                );
            });

            piece.on('drag', (pointer, dragX, dragY) => {
                piece.x = dragX;
                piece.y = dragY;
            });

            piece.on('dragend', (pointer) => {
                piece.setDisplaySize(
                    config.displayWidth,
                    config.displayHeight
                );

                // 检查是否足够接近目标位置
                const distance = Phaser.Math.Distance.Between(
                    piece.x, piece.y,
                    config.targetX, config.targetY
                );

                if (distance < 30) {  // 如果在30像素范围内就吸附
                    piece.x = config.targetX;
                    piece.y = config.targetY;
                    piece.input.draggable = false;

                    // 播放吸附动画
                    this.tweens.add({
                        targets: piece,
                        scale: { from: 1.1, to: 1 },
                        duration: 200,
                        ease: 'Back.easeOut',
                        onComplete: () => {
                            this.completedPieces++;
                            if (this.completedPieces === 4) {
                                this.showCompletionMessage();
                            }
                        }
                    });
                }
            });

            this.pieces.push(piece);
        });

        // 添加计时器
        this.timeText = this.add.text(width - 150, 20, 'Time: 0s', {
            fontSize: '24px',
            fill: '#000',
            backgroundColor: '#ffffff80',
            padding: { x: 10, y: 5 }
        });

        // 添加返回按钮
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

        // 开始游戏
        this.startGame();
    }

    startGame() {
        this.isPlaying = true;
        this.gameStartTime = Date.now();
        
        this.timer = this.time.addEvent({
            delay: 100,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    updateTimer() {
        const elapsedSeconds = Math.floor((Date.now() - this.gameStartTime) / 1000);
        this.timeText.setText(`Time: ${elapsedSeconds}s`);
    }

    showCompletionMessage() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);

        const messageBox = this.add.graphics();
        messageBox.fillStyle(0xE6D5AC, 0.95);
        messageBox.lineStyle(4, 0x8B4513);
        messageBox.fillRoundedRect(width/2 - 300, height/2 - 150, 600, 300, 20);
        messageBox.strokeRoundedRect(width/2 - 300, height/2 - 150, 600, 300, 20);

        const content = this.add.text(width/2, height/2, 
            '太棒了！\n\n' +
            '你成功完成了这幅传统文化画卷！\n' +
            '让我们继续传承和发扬乡村文化！\n\n' +
            '点击任意位置返回', {
            fontSize: '24px',
            fill: '#4A3000',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            window.gameState.medals.culture = true;
            this.scene.start('SceneSelectScene');
        });
    }
}
