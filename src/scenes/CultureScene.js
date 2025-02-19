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
        this.load.image('sparkle', 'images/common/sparkle.png');
        
        // 加载奖牌资源
        this.load.image('gold-medal', 'images/common/gold.png');
        this.load.image('silver-medal', 'images/common/silver.png');
        this.load.image('bronze-medal', 'images/common/bronze.png');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 添加背景
        this.add.image(width/2, height/2, 'culture-bg')
            .setDisplaySize(width, height)
            .setDepth(-1);

        // 添加选中的角色
        const characterType = window.gameState.character || 'female';
        this.player = this.add.sprite(
            width * 0.15,
            height * 0.7,
            characterType
        )
        .setScale(height * 0.001)
        .setDepth(2);

        // 添加右侧完整图展示
        this.totalImage = this.add.image(
            width * 0.8,  // 右侧区域
            height * 0.4, // 上半部分
            'total'
        )
        .setScale(0.25)
        .setDepth(1);

        // 创建游戏区域
        this.createGameArea();

        // 添加返回按钮
        const backButton = this.add.image(80, 40, 'back')
            .setScale(0.6)
            .setDepth(2)
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('SceneSelectScene');
            });

        // 添加状态文本
        this.timeText = this.add.text(width - 200, 20, 'Time: 0s', {
            fontSize: Math.min(width, height) * 0.03 + 'px',
            fill: '#000',
            backgroundColor: '#ffffff80',
            padding: { x: 15, y: 8 }
        }).setDepth(2);

        this.pairsText = this.add.text(width - 200, 70, `Pairs: ${this.matchedPairs}/${this.totalPairs}`, {
            fontSize: Math.min(width, height) * 0.03 + 'px',
            fill: '#000',
            backgroundColor: '#ffffff80',
            padding: { x: 15, y: 8 }
        }).setDepth(2);

        // 直接显示开始提示，移除已完成检查
        this.showStartPrompt();
    }

    // 修改开始提示方法
    showStartPrompt() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 创建半透明黑色背景，设置高层级
        const overlay = this.add.graphics()
            .setDepth(100);  // 设置很高的深度值
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);

        // 创建提示框，设置高层级
        const messageBox = this.add.graphics()
            .setDepth(100);  // 与overlay相同的深度
        messageBox.fillStyle(0xE6D5AC, 0.95);
        messageBox.lineStyle(4, 0x8B4513);
        messageBox.fillRoundedRect(width/2 - 300, height/2 - 150, 600, 300, 20);
        messageBox.strokeRoundedRect(width/2 - 300, height/2 - 150, 600, 300, 20);

        // 文字内容也设置高层级
        const content = this.add.text(width/2, height/2, 
            '欢迎来到文化拼图游戏！\n\n' +
            '拖动拼图块到正确的位置\n' +
            '完成这幅传统文化图画。\n\n' +
            '准备好了吗？点击任意位置开始！', {
            fontSize: '24px',
            fill: '#4A3000',
            align: 'center',
            lineSpacing: 10
        })
        .setOrigin(0.5)
        .setDepth(100);  // 确保文字在最上层

        // 点击开始游戏
        this.input.once('pointerdown', () => {
            overlay.destroy();
            messageBox.destroy();
            content.destroy();
            this.startGame();
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

        // 基础图的层级设置为最低
        this.baseImage = this.add.image(width * 0.4, height * 0.5, 'other')
            .setScale(0.49)
            .setDepth(0);  // 设置为最低层级

        // 获取图片的原始尺寸
        const imageWidth = this.textures.get('other').getSourceImage().width;
        const imageHeight = this.textures.get('other').getSourceImage().height;

        // 计算实际显示尺寸
        const displayWidth = imageWidth * 0.49;
        const displayHeight = imageHeight * 0.49;

        // 计算每个网格的实际尺寸
        const cellWidth = displayWidth / 4;   // 4列
        const cellHeight = displayHeight / 6;  // 6行

        // 计算基础图的左上角坐标
        const baseLeft = this.baseImage.x - (displayWidth / 2);
        const baseTop = this.baseImage.y - (displayHeight / 2);

        // 修改拼图块的位置定义
        const pieces = [
            { 
                key: 'piece-22', 
                x: width * 0.2, 
                y: height * 0.3,
                targetPosition: {
                    row: 1,    // 修改：从0改回1
                    col: 0.95, // 保持不变
                    x: 0,
                    y: 0
                }
            },
            { 
                key: 'piece-33', 
                x: width * 0.2, 
                y: height * 0.5,
                targetPosition: {
                    row: 2,    // 保持不变
                    col: 2.0,  // 从2.2改为2.0，向左移动
                    x: 0,
                    y: 0
                }
            },
            { 
                key: 'piece-42', 
                x: width * 0.6, 
                y: height * 0.3,
                targetPosition: {
                    row: 3,    // 第4行
                    col: 1,    // 第2列
                    x: 0,
                    y: 0
                }
            },
            { 
                key: 'piece-44', 
                x: width * 0.6, 
                y: height * 0.5,
                targetPosition: {
                    row: 3,    // 第4行
                    col: 3,    // 第4列
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

            // 计算基础位置
            piece.targetPosition.x = gridX + (piece.targetPosition.col * cellWidth);
            piece.targetPosition.y = gridY + (piece.targetPosition.row * cellHeight);

            // 为特定拼图块添加相对偏移
            if (piece.key === 'piece-22') {
                piece.targetPosition.x -= cellWidth * 0.06;  // 向左偏移增加到6%的格子宽度（原来是4%）
                piece.targetPosition.y -= cellHeight * 0.05; // 保持原来的垂直偏移
            } else if (piece.key === 'piece-33') {
                piece.targetPosition.x -= cellWidth * 0.01;  // 保持原来的水平偏移
                piece.targetPosition.y -= cellHeight * 0.05; // 保持原来的垂直偏移
            }
        });

        // 创建拼图块
        this.puzzlePieces = pieces.map(piece => {
            const puzzlePiece = this.add.image(piece.x, piece.y, piece.key)
                .setScale(0.49)
                .setDepth(2)  // 设置更高的层级
                .setOrigin(0, 0)
                .setInteractive({ draggable: true });
            
            puzzlePiece.targetPosition = piece.targetPosition;
            return puzzlePiece;
        });

        // 修改拖动事件中的层级设置
        this.input.on('dragstart', (pointer, gameObject) => {
            gameObject.setDepth(3);  // 拖动时提升到更高层级
            gameObject.setAlpha(0.8);
        });

        // 修改拖动检测逻辑
        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;

            const distance = Phaser.Math.Distance.Between(
                gameObject.x, 
                gameObject.y, 
                gameObject.targetPosition.x, 
                gameObject.targetPosition.y
            );
            
            // 调整吸附逻辑和视觉反馈
            if (distance < 80) {  // 减小初始感应范围
                // 计算吸附强度
                const strength = Math.max(0.05, 1 - (distance / 80)); // 降低基础吸附强度
                
                // 更平滑的吸附效果
                if (distance < 40) {  // 在非常接近时才开始吸附
                    gameObject.x = Phaser.Math.Linear(
                        gameObject.x, 
                        gameObject.targetPosition.x, 
                        strength * 2  // 近距离时加强吸附
                    );
                    gameObject.y = Phaser.Math.Linear(
                        gameObject.y, 
                        gameObject.targetPosition.y, 
                        strength * 2
                    );
                }

                // 视觉反馈
                if (distance < 30) {  // 缩小绿色提示范围
                    // 非常接近时显示绿色
                    gameObject.setTint(0x00ff00);
                    this.showSnapGuide(gameObject.targetPosition.x, gameObject.targetPosition.y, true);
                } else if (distance < 60) {  // 扩大黄色提示范围
                    // 在合适范围内显示黄色
                    gameObject.setTint(0xffff00);
                    this.showSnapGuide(gameObject.targetPosition.x, gameObject.targetPosition.y, false);
                } else {
                    gameObject.clearTint();
                    this.hideSnapGuide();
                }
            } else {
                gameObject.clearTint();
                this.hideSnapGuide();
            }
        });

        this.input.on('dragend', (pointer, gameObject) => {
            gameObject.setDepth(2);  // 放下时恢复到普通层级
            gameObject.setAlpha(1);
            this.hideSnapGuide();
            this.checkPiecePosition(gameObject);
        });
    }

    // 改进吸附提示效果
    showSnapGuide(x, y, isClose) {
        if (!this.snapGuide) {
            this.snapGuide = this.add.graphics();
        }
        
        this.snapGuide.clear();
        
        if (isClose) {
            // 近距离时显示绿色提示
            this.snapGuide
                .lineStyle(3, 0x00ff00, 1)
                .strokeCircle(x, y, 40)
                .lineStyle(2, 0x00ff00, 0.5)
                .strokeCircle(x, y, 50);
        } else {
            // 在感应范围内显示黄色提示
            this.snapGuide
                .lineStyle(3, 0xffff00, 0.8)
                .strokeCircle(x, y, 40)
                .lineStyle(2, 0xffff00, 0.4)
                .strokeCircle(x, y, 50);
        }
        
        // 更平滑的闪烁效果
        if (!this.snapGuide.activeTween) {
            this.snapGuide.activeTween = this.tweens.add({
                targets: this.snapGuide,
                alpha: 0.3,
                yoyo: true,
                duration: 400,
                ease: 'Sine.easeInOut',
                repeat: -1
            });
        }
    }

    // 修改位置检测逻辑
    checkPiecePosition(piece) {
        const distance = Phaser.Math.Distance.Between(
            piece.x, 
            piece.y, 
            piece.targetPosition.x, 
            piece.targetPosition.y
        );

        if (distance < 30) {  // 缩小判定范围，使其与绿色提示一致
            // 移除绿色提示，保持原始颜色
            piece.clearTint();
            
            // 更精确的吸附动画
            this.tweens.add({
                targets: piece,
                x: piece.targetPosition.x,
                y: piece.targetPosition.y,
                duration: 300,
                ease: 'Cubic.easeOut',
                onComplete: () => {
                    piece.input.draggable = false;
                    
                    // 增加匹配数量
                    this.matchedPairs++;
                    this.pairsText.setText(`Pairs: ${this.matchedPairs}/4`);
                    
                    if (this.matchedPairs === 4) {
                        setTimeout(() => {
                            this.onPuzzleComplete();
                        }, 500);
                    }
                }
            });
        } else {
            piece.clearTint();
        }
    }

    // 简化放置正确时的效果 - 移除重复的计数逻辑
    addCorrectPlacementEffect(piece) {
        // 不再增加匹配数量，因为已经在 checkPiecePosition 中增加了
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
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);

        // 设置更高的深度值
        const overlay = this.add.graphics()
            .setDepth(100);  // 设置很高的深度值
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, this.scale.width, this.scale.height);

        const messageBox = this.add.graphics()
            .setDepth(100);  // 与overlay相同的深度
        messageBox.fillStyle(0xE6D5AC, 0.95);
        messageBox.lineStyle(4, 0x8B4513);
        messageBox.fillRoundedRect(this.scale.width/2 - 300, this.scale.height/2 - 150, 600, 300, 20);
        messageBox.strokeRoundedRect(this.scale.width/2 - 300, this.scale.height/2 - 150, 600, 300, 20);

        const content = this.add.text(this.scale.width/2, this.scale.height/2, 
            '恭喜完成拼图！\n\n' +
            `用时：${elapsed}秒\n\n` +
            '点击任意位置返回', {
            fontSize: '24px',
            fill: '#4A3000',
            align: 'center',
            lineSpacing: 10
        })
        .setOrigin(0.5)
        .setDepth(100);  // 确保文字在最上层

        this.input.once('pointerdown', () => {
            window.gameState.medals.culture = true;
            this.scene.start('SceneSelectScene');
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
        if (this.totalImage) {
            this.totalImage.setScale(0.25);  // 更新为0.25
        }

        if (this.baseImage) {
            this.baseImage
                .setScale(0.49)
                .setDepth(0);  // 确保基础图始终在最底层
        }

        if (this.puzzlePieces) {
            this.puzzlePieces.forEach(piece => {
                piece
                    .setScale(0.49)
                    .setDepth(2);  // 确保拼图块始终在基础图之上
            });
        }
    }
} 