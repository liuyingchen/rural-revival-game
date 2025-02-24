import { playerManager } from '../managers/PlayerManager.js'; 

export default class CultureScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CultureScene' });
        this.isPlaying = false;
        this.matchedPairs = 0;
        this.totalPairs = 4;  // 总共6对文化元素
        this.selectedItem = null;
        this.gameStartTime = 0;
        this.completedPieces = 0;  // 改为统计完成的拼图块数量
        this.totalPieces = 4;      // 总共需要完成的拼图块数量
        this.pairsText = null;      // 添加进度文本引用
        this.isGameComplete = false;  // 添加游戏完成标记
        // 添加奖牌时间标准
        this.medalTimes = {
            gold: 30,    // 30秒内完成获得金牌
            silver: 45,  // 45秒内完成获得银牌
            bronze: 60   // 60秒内完成获得铜牌
        };
        this.lastUpdateTime = 0;  // 用于控制更新频率
    }

    preload() {
        this.load.setBaseURL('assets/');
        
        // 加载背景音乐
        this.load.audio('culture-bgm', 'audio/culture-bgm.mp3');
        this.load.audio('pingtu', 'audio/pingtu.mp3');  // 添加拼图音效
        this.load.audio('finish', 'audio/finish.mp3');  // 添加完成音效
        
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
            .setDepth(0);

        // 创建并播放背景音乐
        try {
            this.bgm = this.sound.add('culture-bgm', { 
                loop: true,
                volume: 0.5
            });
            this.bgm.play();
        } catch (error) {
            console.warn('Background music failed to load:', error);
        }

        // 添加选中的角色
        const characterType = window.gameState.character || 'female';
        this.player = this.add.sprite(
            this.scale.width * 0.10,
            this.scale.height * 0.75,
            characterType
        ).setScale(this.scale.height * 0.001)
        .setDepth(100);

        // 添加返回按钮
        const backButton = this.add.image(width * 0.05, height * 0.1, 'back')
            .setScale(0.5)
            .setDepth(5)
            .setInteractive()
            .on('pointerdown', () => {
                if (this.bgm) {
                    this.bgm.stop();
                }
                this.scene.start('SceneSelectScene');
            });

        // 初始化状态文本（显示0s）
        this.timeText = this.add.text(width - 200, 20, 'Time: 0s', {
            fontSize: Math.min(width, height) * 0.03 + 'px',
            fill: '#000',
            backgroundColor: '#ffffff80',
            padding: { x: 15, y: 8 }
        }).setDepth(5);

        this.pairsText = this.add.text(width - 200, 70, 'Pairs: 0/4', {
            fontSize: Math.min(width, height) * 0.03 + 'px',
            fill: '#000',
            backgroundColor: '#ffffff80',
            padding: { x: 15, y: 8 }
        }).setDepth(5);

        // 显示欢迎弹窗
        this.showWelcomeDialog();
    }

    // 添加游戏说明弹窗方法
    showWelcomeDialog() {
        // 创建半透明黑色背景，降低透明度
        const overlay = this.add.graphics()
            .setDepth(1);
        overlay.fillStyle(0x000000, 0.3);  // 将透明度从0.7改为0.3
        overlay.fillRect(0, 0, this.scale.width, this.scale.height);

        // 弹窗尺寸和位置
        const boxWidth = this.scale.width * 0.78;     // 弹窗宽度为屏幕宽度的80%
        const boxHeight = this.scale.height * 0.25;   // 弹窗高度保持不变
        const boxY = this.scale.height * 0.75;

        // 创建弹窗背景
        const messageBox = this.add.graphics()
            .setDepth(98);
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

        // 修改文案内容
        const allTextLines = [
            "Dear Pakistani friend, welcome to China's ancient house of rural heritage!",
            "Repair an antique chair using the sunmao joinery, a technique behind architectural marvels like the Forbidden City.",
            "Place the wooden parts correctly to preserve this craft.",
            "Ready to be a cultural guardian?"
        ];

        // 创建文本容器和遮罩
        const textContainer = this.add.container(0, 0).setDepth(99);
        const textMask = this.add.graphics()
            .fillStyle(0xffffff)
            .fillRoundedRect(
                this.scale.width/2 - boxWidth/2,
                boxY - boxHeight/2,
                boxWidth,
                boxHeight
            );
        textContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, textMask));

        // 创建固定数量的文本对象
        const textObjects = [];
        const maxLines = 4;
        const startY = boxY - boxHeight/2 + 25;
        const lineSpacing = boxHeight / 5;
        let currentStartIndex = 0;

        // 创建文本对象
        for (let i = 0; i < maxLines; i++) {
            const text = this.add.text(
                this.scale.width/2 - boxWidth/2 + 40,
                startY + i * lineSpacing,
                '',
                {
                    fontSize: '20px',
                    fill: '#4A3000',
                    align: 'left',
                    wordWrap: { width: boxWidth - 80 }
                }
            )
            .setOrigin(0, 0.5);
            textObjects.push(text);
            textContainer.add(text);
        }

        // 打字机效果
        const typewriterEffect = (textObject, fullText) => {
            return new Promise((resolve) => {
                let currentText = '';
                let currentIndex = 0;
                
                const timer = this.time.addEvent({
                    delay: 30,
                    callback: () => {
                        // 检查textObject是否还存在且是否还在场景中
                        if (!textObject || !textObject.scene) {
                            timer.destroy();
                            resolve();
                            return;
                        }

                        if (currentIndex < fullText.length) {
                            currentText += fullText[currentIndex];
                            textObject.setText(currentText);
                            currentIndex++;
                        } else {
                            timer.destroy();
                            resolve();
                        }
                    },
                    loop: true
                });

                // 可选：添加场景关闭时的清理
                this.events.once('shutdown', () => {
                    timer.destroy();
                    resolve();
                });
            });
        };

        // 显示文本
        const showNextLine = async (index) => {
            if (index < allTextLines.length) {
                await typewriterEffect(textObjects[index], allTextLines[index]);
                if (index + 1 < allTextLines.length) {
                    await showNextLine(index + 1);
                }
            }
        };

        // 开始显示第一行
        showNextLine(0);

        // 点击任意位置关闭弹窗并开始游戏
        this.input.once('pointerdown', () => {
            // 清理弹窗
            messageBox.destroy();
            overlay.destroy();
            textContainer.destroy();
            textMask.destroy();
            textObjects.forEach(text => {
                if (text && text.scene) text.destroy();
            });

            // 只显示配对进度
            this.pairsText.setVisible(true);

            // 创建游戏区域
            this.createGameArea();

            // 只记录开始时间
            this.gameStartTime = Date.now();
        });
    }

    createGameArea() {
        const width = this.scale.width;
        const height = this.scale.height;
        const baseScale = 0.4;

        // 添加半透明黑色遮罩层
        const overlay = this.add.graphics()
            .setDepth(1);
        overlay.fillStyle(0x000000, 0.5);  // 修改这里的透明度，0.7 表示70%不透明度
        overlay.fillRect(0, 0, this.scale.width, this.scale.height);

        // 基础图像位置
        const baseX = width * 0.55;  // 基准X位置，在屏幕55%处
        const baseY = height * 0.5;  // 基准Y位置，在屏幕中间

        // 基础图像（other.png）
        this.baseImage = this.add.image(baseX, baseY, 'other')
            .setScale(baseScale)
            .setDepth(2);

        // 获取拼图块尺寸
        const pieceWidth = this.textures.get('piece-22').getSourceImage().width * baseScale;
        const pieceHeight = this.textures.get('piece-22').getSourceImage().height * baseScale;

        // 计算每个拼图块的目标位置
        const positions = [
            { key: 'piece-22', x: baseX - pieceWidth, y: baseY - pieceHeight },     // 左上
            { key: 'piece-33', x: baseX, y: baseY },                                // 中间
            { key: 'piece-42', x: (baseX - pieceWidth)*1.02, y: baseY + pieceHeight }, // 左下
            { key: 'piece-44', x: (baseX + pieceWidth)*0.98, y: baseY + pieceHeight }  // 右下
        ];

        // 创建拼图块，全部堆叠在右下角
        this.puzzlePieces = positions.map((piece, index) => {
            // 所有拼图块都在右下角区域，稍微错开一点位置
            const randomX = Phaser.Math.Between(width * 0.7, width * 0.75);
            const randomY = Phaser.Math.Between(height * 0.65, height * 0.7);

            return this.add.image(randomX, randomY, piece.key)
                .setScale(baseScale)
                .setDepth(3)
                .setOrigin(0, 1)
                .setInteractive({ draggable: true })
                .setData('targetX', piece.x)
                .setData('targetY', piece.y);
        });

        // 添加拖拽事件处理
        this.input.on('dragstart', (pointer, gameObject) => {
            gameObject.setDepth(4);  // 拖拽时提升层级
            gameObject.setAlpha(0.8);  // 拖拽时略微透明
        });

        this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;

            // 检查是否接近目标位置
            const distance = Phaser.Math.Distance.Between(
                dragX, dragY,
                gameObject.getData('targetX'),
                gameObject.getData('targetY')
            );

            // 接近时显示吸附提示
            if (distance < 50) {  // 吸附距离阈值
                this.showSnapGuide(gameObject.getData('targetX'), gameObject.getData('targetY'));
            } else {
                this.hideSnapGuide();
            }
        });

        this.input.on('dragend', (pointer, gameObject) => {
            gameObject.setAlpha(1);  // 恢复完全不透明
            gameObject.setDepth(3);  // 恢复原来的层级

            const distance = Phaser.Math.Distance.Between(
                gameObject.x, gameObject.y,
                gameObject.getData('targetX'),
                gameObject.getData('targetY')
            );

            if (distance < 50) {  // 在吸附范围内
                // 播放拼图音效
                const pingtuSound = this.sound.add('pingtu', { 
                    volume: 0.6,
                    loop: false
                });
                pingtuSound.play();
                pingtuSound.once('complete', () => pingtuSound.destroy());

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
                    x: gameObject.getData('targetX'),
                    y: gameObject.getData('targetY'),
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

        // 在创建完游戏区域后开始计时
        this.gameStartTime = Date.now();
        
        // 开始计时
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                try {
                    const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
                    if (this.timeText && this.timeText.active) {
                        this.timeText.setText(`Time: ${elapsed}s`);
                    }
                } catch (error) {
                    // 忽略文本更新错误，不影响游戏流程
                    console.log('Time text update skipped');
                }
            },
            loop: true
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

    // 修改检查拼图放置的函数
    checkPuzzlePlacement(gameObject) {
        const distance = Phaser.Math.Distance.Between(
            gameObject.x, gameObject.y,
            gameObject.getData('targetX'),
            gameObject.getData('targetY')
        );

        if (distance < 50) {  // 在吸附范围内
            // 播放拼图音效
            const pingtuSound = this.sound.add('pingtu', { 
                volume: 0.6,
                loop: false
            });
            pingtuSound.play();
            pingtuSound.once('complete', () => pingtuSound.destroy());

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
                x: gameObject.getData('targetX'),
                y: gameObject.getData('targetY'),
                duration: 200,
                ease: 'Back.out',
                onComplete: () => {
                    gameObject.input.draggable = false;  // 禁止继续拖动
                    this.checkPuzzleProgress();
                    gameObject.preFX.clear();
                }
            });
        }
    }

    // 修改检查进度的函数
    checkPuzzleProgress() {
        let correctPieces = 0;
        this.puzzlePieces.forEach(piece => {
            const distance = Phaser.Math.Distance.Between(
                piece.x, piece.y,
                piece.getData('targetX'),
                piece.getData('targetY')
            );
            if (distance < 5) correctPieces++;
        });

        // 更新进度显示
        this.pairsText.setText(`Pairs: ${correctPieces}/${this.totalPieces}`);

        // 如果所有拼图块都放置正确
        if (correctPieces === this.totalPieces) {
            // 计算完成时间和奖牌
            const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
            let medal = 'bronze';
            if (elapsed <= this.medalTimes.gold) {
                medal = 'gold';
            } else if (elapsed <= this.medalTimes.silver) {
                medal = 'silver';
            }

            // 更新玩家奖励并显示完成消息
            playerManager.updateGameMedal('culture', medal);
            this.showCompletionMessage(medal);
        }
    }

    // 添加重置拼图的函数
    resetPuzzle() {
        // 清理当前拼图
        this.puzzlePieces.forEach(piece => piece.destroy());
        
        // 重新创建拼图
        this.createGameArea();
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
        // 先停止背景音乐
        if (this.bgm) {
            this.bgm.stop();
            this.bgm.destroy();  // 确保完全清理音频资源
        }

        // 计算完成时间和奖牌等级
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
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

        // 显示完成界面并同时播放音效
        this.showCompletionMessage(medalLevel);
    }

    // 修改完成消息显示方法
    showCompletionMessage(medalLevel) {
        // 停止背景音乐
        if (this.bgm) {
            this.bgm.stop();
            this.bgm.destroy();
        }

        // 播放完成音效
        const finishSound = this.sound.add('finish', { 
            volume: 0.8,
            loop: false
        });
        finishSound.play();

        // 音效播放完成后清理资源
        finishSound.once('complete', () => {
            finishSound.destroy();
        });

        // 显示完成界面
        this.isPlaying = false;
        
        // 获取游戏完成时间
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);

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
            `Time: ${elapsed}s`, {
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
            this.player.setPosition(width * 0.10, height * 0.75)
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
                .setPosition(width * 0.55, height * 0.5)  // 更新位置
                .setScale(baseScale)
                .setDepth(0);
        }

        if (this.puzzlePieces) {
            this.puzzlePieces.forEach(piece => {
                piece.setScale(baseScale)
                    .setDepth(3);
            });
        }
    }

    // 添加场景关闭时的清理方法
    shutdown() {
        // 清理计时器
        if (this.gameTimer) {
            this.gameTimer.remove();
        }

        // 确保在场景关闭时停止所有音频
        if (this.bgm) {
            this.bgm.stop();
            this.bgm.destroy();
        }
        
        // 停止所有其他音效
        this.sound.stopAll();

        this.isPlaying = false;
        // ... 其他清理代码 ...
    }

    showGreenEffect(piece) {
        // 播放拼图放置音效
        const pingtuSound = this.sound.add('pingtu', { 
            volume: 0.6,
            loop: false
        });
        pingtuSound.play();

        // 音效播放完成后清理资源
        pingtuSound.once('complete', () => {
            pingtuSound.destroy();
        });

        // 保持原有的绿色动态效果
        const effect = this.add.graphics();
        effect.lineStyle(4, 0x00ff00);
        effect.strokeRect(piece.x - piece.width/2, piece.y - piece.height/2, piece.width, piece.height);

        this.tweens.add({
            targets: effect,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                effect.destroy();
            }
        });
    }

    // 添加更新配对计数的方法
    updatePairsText() {
        if (this.pairsText) {
            this.pairsText.setText(`Pairs: ${this.matchedPairs}/${this.totalPairs}`);
        }
    }

    // 添加场景重置方法
    reset() {
        this.isGameComplete = false;
        this.completedPieces = 0;
        this.gameStartTime = Date.now();
        if (this.puzzlePieces) {
            this.puzzlePieces.forEach(piece => piece.destroy());
        }
        this.createGameArea();
    }

    update(time) {
        // 只在游戏进行中且每秒更新一次
        if (this.isPlaying && time - this.lastUpdateTime >= 1000) {
            this.lastUpdateTime = time;
            const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
            if (this.pairsText && this.pairsText.active) {
                this.pairsText.setText(`Time: ${elapsed}s`);
            }
        }
    }
} 