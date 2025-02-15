export default class CultureScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CultureScene' });
        this.puzzlePieces = [];  // 存储拼图块
        this.isPlaying = false;
        this.startTime = 0;
    }

    preload() {
        // 加载拼图资源
        this.load.image('puzzle-bg', 'assets/images/scenes/culture/puzzle-bg.png');  // 背景图
        // 加载6个拼图块
        for (let i = 1; i <= 6; i++) {
            this.load.image(`puzzle-${i}`, `assets/images/scenes/culture/piece-${i}.png`);
        }
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 添加背景
        this.add.image(width/2, height/2, 'puzzle-bg')
            .setDisplaySize(width, height);

        // 创建拼图区域（右侧）
        const puzzleArea = {
            x: width * 0.5,
            y: height * 0.3,
            width: width * 0.4,
            height: height * 0.6
        };

        // 创建拼图块的初始位置（左侧）
        const pieces = [
            { x: width * 0.2, y: height * 0.2 },
            { x: width * 0.2, y: height * 0.4 },
            { x: width * 0.2, y: height * 0.6 },
            { x: width * 0.3, y: height * 0.3 },
            { x: width * 0.3, y: height * 0.5 },
            { x: width * 0.3, y: height * 0.7 }
        ];

        // 创建拼图块
        pieces.forEach((pos, index) => {
            const piece = this.add.image(pos.x, pos.y, `puzzle-${index + 1}`)
                .setInteractive({ draggable: true, pixelPerfect: true })  // 使用像素级别的检测
                .setScale(0.8);

            // 设置正确位置
            piece.correctX = puzzleArea.x + (index % 3) * piece.width * 0.8;
            piece.correctY = puzzleArea.y + Math.floor(index / 3) * piece.height * 0.8;

            // 添加拖动事件
            this.input.setDraggable(piece);
            
            piece.on('dragstart', function (pointer) {
                this.setTint(0x44ff44);  // 拖动时显示绿色
                this.setDepth(1);  // 确保被拖动的块在最上层
                this.setScale(0.85);  // 拖动时略微放大
            });

            piece.on('drag', function (pointer, dragX, dragY) {
                this.x = dragX;
                this.y = dragY;

                // 当接近正确位置时显示提示效果
                const distance = Phaser.Math.Distance.Between(this.x, this.y, this.correctX, this.correctY);
                if (distance < 100) {  // 增大检测范围
                    this.setTint(0x88ff88);  // 接近时显示浅绿色
                    // 添加磁性吸附效果
                    const pullStrength = 0.1;  // 吸附强度
                    this.x += (this.correctX - this.x) * pullStrength;
                    this.y += (this.correctY - this.y) * pullStrength;
                } else {
                    this.clearTint();
                }
            });

            piece.on('dragend', function (pointer) {
                this.setScale(0.8);  // 恢复原始大小
                this.clearTint();
                this.setDepth(0);
                
                // 增大吸附范围，更容易放置
                if (Phaser.Math.Distance.Between(this.x, this.y, this.correctX, this.correctY) < 100) {
                    // 添加吸附动画
                    this.scene.tweens.add({
                        targets: this,
                        x: this.correctX,
                        y: this.correctY,
                        duration: 200,
                        ease: 'Back.out',
                        onComplete: () => {
                            this.input.draggable = false;  // 锁定位置
                            this.setTint(0x00ff00);  // 正确位置显示绿色
                            
                            // 添加完成效果
                            const sparkle = this.scene.add.particles(this.x, this.y, 'sparkle', {
                                lifespan: 1000,
                                speed: { min: 50, max: 100 },
                                scale: { start: 0.5, end: 0 },
                                quantity: 10,
                                duration: 500
                            });
                        }
                    });
                }
            });

            this.puzzlePieces.push(piece);
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

        // 检查完成状态
        this.time.addEvent({
            delay: 500,
            callback: this.checkCompletion,
            callbackScope: this,
            loop: true
        });
    }

    checkCompletion() {
        const allCorrect = this.puzzlePieces.every(piece => 
            piece.x === piece.correctX && piece.y === piece.correctY
        );

        if (allCorrect) {
            this.showCompletionMessage();
        }
    }

    showCompletionMessage() {
        // 创建完成提示
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);

        const messageBox = this.add.graphics();
        messageBox.fillStyle(0xffffff, 1);
        messageBox.fillRoundedRect(width/2 - 200, height/2 - 100, 400, 200, 20);

        const message = this.add.text(width/2, height/2, '恭喜完成拼图！\n\n点击任意位置继续', {
            fontSize: '24px',
            fill: '#000000',
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            overlay.destroy();
            messageBox.destroy();
            message.destroy();
            window.gameState.medals.culture = true;
        });
    }
}
