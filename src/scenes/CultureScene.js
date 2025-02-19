import { playerManager } from '../managers/PlayerManager.js'; 

export default class CultureScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CultureScene' });
        this.isPlaying = false;
        this.matchedPairs = 0;
        this.totalPairs = 6;  // 总共6对文化元素
        this.selectedItem = null;
        this.gameStartTime = 0;
        // 添加奖牌时间标准
        this.medalTimes = {
            gold: 30,    // 30秒内完成获得金牌
            silver: 45,  // 45秒内完成获得银牌
            bronze: 60   // 60秒内完成获得铜牌
        };
    }

    preload() {
        this.load.setBaseURL('assets/');
        
        // 加载场景资源
        this.load.image('culture-bg', 'images/scenes/culture/background.png');
        this.load.image('total', 'images/scenes/culture/total.png');        // 右侧完整图
        this.load.image('other', 'images/scenes/culture/other.png');        // 中心基础图
        this.load.image('piece-22', 'images/scenes/culture/22.png');        // 拼图块
        this.load.image('piece-33', 'images/scenes/culture/33.png');
        this.load.image('piece-42', 'images/scenes/culture/42.png');
        this.load.image('piece-44', 'images/scenes/culture/44.png');
        
        // 加载通用资源
        this.load.image('back', 'images/common/back.png');
        
        // 加载奖牌资源
        this.load.image('gold-medal', 'images/common/gold.png');
        this.load.image('silver-medal', 'images/common/silver.png');
        this.load.image('bronze-medal', 'images/common/bronze.png');

        // 加载奖励相关资源
        this.load.image('reward-bg', 'images/common/reward-bg.png');
        this.load.image('gold', 'images/common/gold.png');
        this.load.image('silver', 'images/common/silver.png');
        this.load.image('bronze', 'images/common/bronze.png');
        this.load.image('try-again-btn', 'images/common/try-again.png');
        this.load.image('other-games-btn', 'images/common/other-games.png');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 添加背景
        this.add.image(width/2, height/2, 'culture-bg')
            .setDisplaySize(width, height)
            .setDepth(-1);

        // 添加选中的角色（保持在左侧）
        const characterType = window.gameState.character || 'female';
        this.player = this.add.sprite(
            width * 0.15,  // 保持在左侧
            height * 0.7,  // 保持原位置
            characterType
        )
        .setScale(height * 0.001)
        .setDepth(2);

        // 添加返回按钮
        const backButton = this.add.image(80, 40, 'back')
            .setScale(0.6)
            .setDepth(2)
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('SceneSelectScene');
            });

        // 延迟2秒显示游戏说明弹窗
        this.time.delayedCall(2000, () => {
            this.showInstructions();
        });
    }

    // 添加游戏说明弹窗方法
    showInstructions() {
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, this.scale.width, this.scale.height);

        // 修改弹窗尺寸和位置
        const boxWidth = 800;  // 更宽
        const boxHeight = 200;  // 更矮
        const boxY = this.scale.height * 0.75;  // 更靠近底部

        const messageBox = this.add.graphics();
        messageBox.fillStyle(0xE6D5AC, 0.95);
        messageBox.lineStyle(4, 0x8B4513);
        messageBox.fillRoundedRect(
            this.scale.width/2 - boxWidth/2, 
            boxY - boxHeight/2, 
            boxWidth, 
            boxHeight, 
            20
        );
        messageBox.strokeRoundedRect(
            this.scale.width/2 - boxWidth/2, 
            boxY - boxHeight/2, 
            boxWidth, 
            boxHeight, 
            20
        );

        // 分段创建文本，以便添加动画
        const textLines = [
            '欢迎来到传统文化拼图游戏！',
            '通过拼图来了解我们的传统文化。',
            '拖动拼图块到正确的位置，完成这幅传统文化图画。',
            '准备好了吗？点击任意位置开始！'
        ];

        const textObjects = [];
        const startY = boxY - boxHeight/2 + 40;
        const lineSpacing = 30;

        // 创建所有文本对象（初始透明）
        textLines.forEach((line, index) => {
            const text = this.add.text(
                this.scale.width/2, 
                startY + index * lineSpacing,
                line,
                {
                    fontSize: '24px',
                    fill: '#4A3000',
                    align: 'center'
                }
            )
            .setOrigin(0.5)
            .setAlpha(0);  // 初始设置为透明

            textObjects.push(text);
        });

        // 依次显示每行文本的动画
        textObjects.forEach((text, index) => {
            this.tweens.add({
                targets: text,
                alpha: 1,
                y: text.y - 10,  // 略微上移
                duration: 500,
                ease: 'Power2',
                delay: index * 300  // 每行文本依次出现
            });
        });

        this.input.once('pointerdown', () => {
            // 使用普通的 tween 序列替代 timeline
            const fadeOutTexts = () => {
                textObjects.forEach((text, index) => {
                    this.tweens.add({
                        targets: text,
                        alpha: 0,
                        y: text.y - 20,
                        duration: 200,
                        ease: 'Power2',
                        delay: index * 100
                    });
                });

                // 最后一个文本消失后，执行弹窗消失动画
                this.tweens.add({
                    targets: [messageBox, overlay],
                    alpha: 0,
                    duration: 300,
                    ease: 'Power2',
                    delay: textObjects.length * 100,
                    onComplete: () => {
                        // 清理所有元素
                        [...textObjects, messageBox, overlay].forEach(obj => obj.destroy());
                        
                        // 创建游戏区域
                        this.createGameArea();

                        // 添加状态文本
                        this.timeText = this.add.text(this.scale.width - 200, 20, 'Time: 0s', {
                            fontSize: Math.min(this.scale.width, this.scale.height) * 0.03 + 'px',
                            fill: '#000',
                            backgroundColor: '#ffffff80',
                            padding: { x: 15, y: 8 }
                        }).setDepth(2);

                        this.pairsText = this.add.text(this.scale.width - 200, 70, `Pairs: ${this.matchedPairs}/${this.totalPairs}`, {
                            fontSize: Math.min(this.scale.width, this.scale.height) * 0.03 + 'px',
                            fill: '#000',
                            backgroundColor: '#ffffff80',
                            padding: { x: 15, y: 8 }
                        }).setDepth(2);

                        // 开始游戏
                        this.startGame();
                    }
                });
            };

            fadeOutTexts();
        });
    }

    // 添加开始游戏方法
    startGame() {
        this.isPlaying = true;
        this.matchedPairs = 0;
        this.gameStartTime = Date.now();

        // 开始计时
        this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    // 添加计时器更新方法
    updateTimer() {
        if (this.isPlaying) {
            const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
            this.timeText.setText(`Time: ${elapsed}s`);
        }
    }

    createGameArea() {
        const width = this.scale.width;
        const height = this.scale.height;
        const baseScale = 0.4;  // 缩小基础比例

        // 基础图像（移到右侧）
        this.baseImage = this.add.image(
            width * 0.7,     // 移到右侧 70% 位置
            height * 0.45,   // 稍微降低高度到 45%
            'other'
        )
        .setScale(baseScale)
        .setDepth(0);

        // 获取图片的实际显示尺寸
        const imageWidth = this.textures.get('other').getSourceImage().width * baseScale;
        const imageHeight = this.textures.get('other').getSourceImage().height * baseScale;

        // 计算每个网格的实际尺寸
        const cellWidth = imageWidth / 4;   // 4列
        const cellHeight = imageHeight / 6;  // 6行

        // 计算基础图的左上角坐标
        const baseLeft = this.baseImage.x - (imageWidth / 2);
        const baseTop = this.baseImage.y - (imageHeight / 2);

        // 修改拼图块的位置定义
        const pieces = [
            { 
                key: 'piece-22',
                x: width * 0.4,    // 初始位置在左侧
                y: height * 0.3,
                targetPosition: {  
                    row: 2,
                    col: 2,
                    x: 0,         
                    y: 0          
                }
            },
            { 
                key: 'piece-33',
                x: width * 0.4, 
                y: height * 0.5,
                targetPosition: {
                    row: 3,
                    col: 3,
                    x: 0,
                    y: 0
                }
            },
            { 
                key: 'piece-42',
                x: width * 0.5, 
                y: height * 0.3,
                targetPosition: {
                    row: 4,
                    col: 2,
                    x: 0,
                    y: 0
                }
            },
            { 
                key: 'piece-44',
                x: width * 0.5, 
                y: height * 0.5,
                targetPosition: {
                    row: 4,
                    col: 4,
                    x: 0,
                    y: 0
                }
            }
        ];

        // 计算每个拼图块的具体目标位置
        pieces.forEach(piece => {
            const gridX = this.baseImage.x - (this.baseImage.displayWidth / 2);
            const gridY = this.baseImage.y - (this.baseImage.displayHeight / 2);
            
            const cellWidth = this.baseImage.displayWidth / 4;
            const cellHeight = this.baseImage.displayHeight / 6;

            // 保持原来的目标点位置计算（不变）
            piece.targetPosition.x = gridX + (piece.targetPosition.col * cellWidth);
            piece.targetPosition.y = gridY + (piece.targetPosition.row * cellHeight);

            // 移除之前添加的偏移，因为我们要用这个点作为拼图的右下角
            // piece.targetPosition.x -= cellWidth;
            // piece.targetPosition.y -= cellHeight;
        });

        // 创建拼图块并添加交互
        this.puzzlePieces = pieces.map(piece => {
            const puzzlePiece = this.add.image(piece.x, piece.y, piece.key)
                .setScale(baseScale)
                .setDepth(2)
                .setInteractive({ draggable: true })
                // 设置原点为右下角，这样拼图块会以右下角对齐目标点
                .setOrigin(1, 1);  // 这是关键修改
            
            puzzlePiece.targetPosition = piece.targetPosition;
            return puzzlePiece;
        });

        // 添加拖动事件
        this.input.on('dragstart', (pointer, gameObject) => {
            gameObject.setDepth(3);
            gameObject.setAlpha(0.8);
            gameObject.preFX.clear();  // 清除之前的特效
        });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;

            // 检查是否接近目标位置
            const distance = Phaser.Math.Distance.Between(
                dragX, dragY,
                gameObject.targetPosition.x,
                gameObject.targetPosition.y
            );

            if (distance < 50) {  // 吸附距离阈值
                this.showSnapGuide(gameObject.targetPosition.x, gameObject.targetPosition.y);
            } else {
                this.hideSnapGuide();
            }
        });

        this.input.on('dragend', (pointer, gameObject) => {
            gameObject.setAlpha(1);
            gameObject.setDepth(2);

            const distance = Phaser.Math.Distance.Between(
                gameObject.x, gameObject.y,
                gameObject.targetPosition.x,
                gameObject.targetPosition.y
            );

            if (distance < 50) {
                // 添加绿色边框效果
                const glowFX = gameObject.preFX.addGlow(0x00ff00, 8, 0, false, 0.1, 16);
                
                // 边框动画
                this.tweens.add({
                    targets: glowFX,
                    outerStrength: 4,
                    yoyo: true,
                    duration: 200,
                    repeat: 1
                });

                // 位置吸附动画
                this.tweens.add({
                    targets: gameObject,
                    x: gameObject.targetPosition.x,
                    y: gameObject.targetPosition.y,
                    duration: 200,
                    ease: 'Back.out',
                    onComplete: () => {
                        this.hideSnapGuide();
                        this.checkPuzzleProgress();
                        // 动画结束后移除边框效果
                        gameObject.preFX.clear();
                    }
                });
            }
        });
    }

    // 添加吸附提示效果
    showSnapGuide(x, y) {
        if (!this.snapGuide) {
            this.snapGuide = this.add.graphics();
            this.snapGuide.lineStyle(2, 0x00ff00);
            this.snapGuide.strokeCircle(x, y, 30);

            // 添加闪烁动画
            this.snapGuide.activeTween = this.tweens.add({
                targets: this.snapGuide,
                alpha: { from: 0.2, to: 1 },
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
    }

    // 添加检查拼图进度的方法
    checkPuzzleProgress() {
        // 检查所有拼图块是否都在正确位置
        let correctPieces = 0;
        this.puzzlePieces.forEach(piece => {
            const distance = Phaser.Math.Distance.Between(
                piece.x, 
                piece.y, 
                piece.targetPosition.x, 
                piece.targetPosition.y
            );

            if (distance < 30) {  // 如果拼图块在正确位置
                piece.input.draggable = false;  // 禁止进一步拖动
                correctPieces++;
            }
        });

        // 更新进度显示
        this.pairsText.setText(`Pairs: ${correctPieces}/4`);

        // 如果所有拼图都放置正确
        if (correctPieces === 4) {
            // 延迟一下再显示完成效果
            this.time.delayedCall(500, () => {
                this.onPuzzleComplete();
            });
        }
    }

    // 修改隐藏吸附提示的方法
    hideSnapGuide() {
        if (this.snapGuide) {
            // 停止当前的闪烁动画
            if (this.snapGuide.activeTween) {
                this.snapGuide.activeTween.stop();
                this.snapGuide.activeTween = null;
            }
            // 清除图形并销毁
            this.snapGuide.clear();
            this.snapGuide.destroy();
            this.snapGuide = null;  // 确保完全清除引用
        }
    }

    // 修改拼图完成的效果
    onPuzzleComplete() {
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        let medal = null;

        // 根据完成时间确定奖牌
        if (elapsed <= this.medalTimes.gold) {
            medal = 'gold';
        } else if (elapsed <= this.medalTimes.silver) {
            medal = 'silver';
        } else if (elapsed <= this.medalTimes.bronze) {
            medal = 'bronze';
        }

        // 更新玩家奖励
        playerManager.updateGameMedal('culture', medal);

        // 显示完成消息
        this.showCompletionMessage(medal);
    }

    // 修改完成消息显示方法
    showCompletionMessage(medal) {
        this.isPlaying = false;
        
        // 获取游戏完成时间
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);

        // 确定奖牌等级
        let medalLevel = null;
        if (elapsed <= this.medalTimes.gold) {
            medalLevel = 'gold';
        } else if (elapsed <= this.medalTimes.silver) {
            medalLevel = 'silver';
        } else {
            medalLevel = 'bronze';
        }

        // 更新玩家奖励
        playerManager.updateGameMedal('culture', medalLevel);

        // 添加奖励背景
        const bg = this.add.image(this.scale.width/2, this.scale.height/2, 'reward-bg')
            .setDisplaySize(this.scale.width, this.scale.height)
            .setDepth(5);

        // 添加 CONGRATULATIONS 标题
        const title = this.add.text(this.scale.width/2, this.scale.height * 0.2, 'CONGRATULATIONS', {
            fontSize: '48px',
            fontWeight: 'bold',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 6
        })
        .setOrigin(0.5)
        .setDepth(6);

        // 添加奖牌图片
        const medalImage = this.add.image(this.scale.width/2, this.scale.height * 0.45, `${medalLevel}`)
            .setScale(0.4)
            .setDepth(6);

        // 添加 PASS 文本
        const passText = this.add.text(this.scale.width/2, this.scale.height * 0.65, 
            `${medalLevel.toUpperCase()} PASS`, {
            fontSize: '36px',
            fontWeight: 'bold',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        })
        .setOrigin(0.5)
        .setDepth(6);

        // 添加完成时间文本
        const timeText = this.add.text(this.scale.width/2, this.scale.height * 0.75, 
            `完成时间: ${elapsed}秒`, {
            fontSize: '24px',
            fill: '#FFFFFF'
        })
        .setOrigin(0.5)
        .setDepth(6);

        // 添加按钮
        const buttonY = this.scale.height * 0.85;
        const buttonSpacing = 150;

        // 再试一次按钮
        const tryAgainBtn = this.add.image(this.scale.width/2 - buttonSpacing, buttonY, 'try-again-btn')
            .setScale(0.8)
            .setInteractive()
            .setDepth(6);

        // 其他游戏按钮
        const otherGamesBtn = this.add.image(this.scale.width/2 + buttonSpacing, buttonY, 'other-games-btn')
            .setScale(0.8)
            .setInteractive()
            .setDepth(6);

        // 添加按钮交互效果
        [tryAgainBtn, otherGamesBtn].forEach(btn => {
            btn.on('pointerover', () => {
                btn.setScale(0.85);
            });
            btn.on('pointerout', () => {
                btn.setScale(0.8);
            });
        });

        // 添加按钮点击事件
        tryAgainBtn.on('pointerdown', () => {
            this.scene.restart();
        });

        otherGamesBtn.on('pointerdown', () => {
            this.scene.start('SceneSelectScene');
        });

        // 添加奖牌动画效果
        this.tweens.add({
            targets: medalImage,
            scale: { from: 0.2, to: 0.4 },
            duration: 1000,
            ease: 'Back.out',
            onComplete: () => {
                this.tweens.add({
                    targets: medalImage,
                    scale: { from: 0.4, to: 0.425 },
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });
    }

    // 修改 resize 方法，确保层级关系保持不变
    resize() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 更新背景尺寸
        this.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'culture-bg') {
                child.setDisplaySize(width, height);
            }
        });

        // 更新角色位置和大小
        if (this.player) {
            this.player.setPosition(width * 0.15, height * 0.7)
                .setScale(height * 0.001);
        }

        // 更新返回按钮位置
        this.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'back') {
                child.setPosition(80, 40);
            }
        });

        // 更新游戏区域的缩放
        const baseScale = 0.4;  // 使用新的缩放比例

        if (this.baseImage) {
            this.baseImage
                .setPosition(width * 0.7, height * 0.45)  // 更新位置
                .setScale(baseScale)
                .setDepth(0);
        }

        if (this.puzzlePieces) {
            this.puzzlePieces.forEach(piece => {
                piece.setScale(baseScale)
                    .setDepth(2);
            });
        }
    }
} 