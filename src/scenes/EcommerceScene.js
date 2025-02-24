import { playerManager } from '../managers/PlayerManager.js';

export default class EcommerceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EcommerceScene' });
        
        // 初始化游戏状态
        if (!window.gameState) {
            window.gameState = {
                medals: {},
                character: 'female'
            };
        }
        if (!window.gameState.medals) {
            window.gameState.medals = {};
        }
        if (window.gameState.medals.ecommerce === undefined) {
            window.gameState.medals.ecommerce = null;  // 或者 false
        }

        // 其他初始化
        this.isPlaying = false;
        this.score = 0;
        this.totalBoxes = 0;
        this.packedBoxes = 0;
        this.gameStartTime = 0;
        this.boxCount = 0;        // 已完成的箱子数
        this.targetBoxCount = 20; // 目标箱子数改为20
        this.isPackingAnimating = false;  // 添加角色动画状态标记
        // 添加奖牌时间标准
        this.medalTimes = {
            gold: 30,    // 30秒内完成获得金牌
            silver: 45,  // 45秒内完成获得银牌
            bronze: 60   // 60秒内完成获得铜牌
        };
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 添加背景
        this.add.image(width/2, height/2, 'ecommerce-bg')
            .setDisplaySize(width, height);

        // 创建并播放背景音乐
        try {
            this.bgm = this.sound.add('ecommerce-bgm', {
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
            width * 0.10,  // 修改为与 CultureScene 相同的位置
            height * 0.75,  // 修改为与 CultureScene 相同的位置
            characterType
        ).setScale(height * 0.001)  // 使用相同的缩放比例
        .setDepth(99);  // 使用相同的深度值

        // 添加返回按钮
        const backButton = this.add.image(width * 0.05, height * 0.1, 'back')
            .setScale(0.6)
            .setDepth(2)
            .setInteractive()
            .on('pointerdown', () => {
                // 停止背景音乐
                if (this.bgm) {
                    this.bgm.stop();
                    this.bgm.destroy();
                }
                // 返回场景选择
                this.scene.start('SceneSelectScene');
            });

        // 添加返回按钮的悬停效果
        backButton.on('pointerover', () => {
            backButton.setScale(0.65);
        });
        
        backButton.on('pointerout', () => {
            backButton.setScale(0.6);
        });

        // 初始化状态文本（显示0s）
        this.timeText = this.add.text(width - 200, 20, 'Time: 0s', {
            fontSize: Math.min(width, height) * 0.03 + 'px',
            fill: '#000',
            backgroundColor: '#ffffff80',
            padding: { x: 15, y: 8 }
        }).setDepth(2);

        this.boxText = this.add.text(width - 200, 70, `Box: ${this.boxCount}/${this.targetBoxCount}`, {
            fontSize: Math.min(width, height) * 0.03 + 'px',
            fill: '#000',
            backgroundColor: '#ffffff80',
            padding: { x: 15, y: 8 }
        }).setDepth(2);

        // 检查是否已经获得奖牌，如果没有则显示欢迎弹窗
        if (window.gameState.medals.ecommerce) {
            this.startGame();
        } else {
            this.showWelcomeDialog();
        }

        // 传送带位置和尺寸调整
        this.conveyor = this.add.image(
            width * 0.58,
            height * 0.71,
            'conveyor'
        ).setScale(height*0.0015,height * 0.00065);

        // 打开的箱子位置调整
        this.openBox = this.add.image(
            width * 0.2,
            height * 0.80,
            'box-open'
        ).setScale(height * 0.0005)
        .setInteractive()
        .setDepth(1);

        // 添加悬停效果
        this.openBox.on('pointerover', () => {
            this.openBox.setTint(0x88ff88);
        });
        
        this.openBox.on('pointerout', () => {
            this.openBox.clearTint();
        });

        this.openBox.on('pointerdown', () => {
            if (!this.isPlaying || this.isPackingAnimating) return;
            
           
            
            this.playPackingAnimation();
            this.sealAndMoveBox();
            
            // 动画完成后恢复背景音乐
            // this.time.delayedCall(2500, () => {
            //     if (this.bgm && !this.bgm.isPlaying) {
            //         this.bgm.resume();
            //     }
            // });
        });

        // 初始化键盘控制
        this.cursors = this.input.keyboard.createCursorKeys();

        // 添加箱子的提示动画
        this.addBoxHintAnimations();
    }

    showWelcomeDialog() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 创建半透明黑色遮罩
        const overlay = this.add.graphics()
            .setDepth(98);
        overlay.fillStyle(0x000000, 0.3);
        overlay.fillRect(0, 0, width, height);

        // 弹窗尺寸和位置
        const boxWidth = width * 0.8;
        const boxHeight = height * 0.25;
        const boxY = height * 0.75;

        // 创建弹窗背景
        const messageBox = this.add.graphics()
            .setDepth(98);
        messageBox.fillStyle(0xE6D5AC, 0.95);
        messageBox.lineStyle(4, 0x8B4513);
        messageBox.fillRoundedRect(
            width/2 - boxWidth/2,
            boxY - boxHeight/2,
            boxWidth,
            boxHeight,
            20
        );
        messageBox.strokeRoundedRect(
            width/2 - boxWidth/2,
            boxY - boxHeight/2,
            boxWidth,
            boxHeight,
            20
        );

        // 创建文本容器和遮罩
        const textContainer = this.add.container(0, 0).setDepth(99);
        const textMask = this.add.graphics()
            .fillStyle(0xffffff)
            .fillRect(
                width/2 - boxWidth/2,
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

        // 创建文本对象
        for (let i = 0; i < maxLines; i++) {
            const text = this.add.text(
                width/2 - boxWidth/2 + 40,
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

                this.events.once('shutdown', () => {
                    timer.destroy();
                    resolve();
                });
            });
        };

        // 欢迎文本内容
        const allTextLines = [
            "Dear Pakistani friend, welcome to the village express station!",
            "As logistics commander, click to pack parcels marked for cities.",
            "Each package you seal helps better the urban developent."
        ];

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

            // 开始游戏
            this.startGame();

            // 记录开始时间
            this.gameStartTime = Date.now();
        });
    }

    createPackageBox() {
        // 创建一个半透明的蓝色高亮区域
        const highlightZone = this.add.graphics();
        highlightZone.fillStyle(0x4A90E2, 0.1);  // 非常淡的蓝色
        highlightZone.fillRect(50, 350, 200, 200);

        // 创建一个虚线边框的投放区域
        const dropZone = this.add.graphics();
        dropZone.lineStyle(2, 0x4A90E2, 0.8);  // 蓝色虚线边框

        // 绘制虚线边框
        const spacing = 10;  // 虚线间隔
        const x = 50;
        const y = 350;
        const width = 200;
        const height = 200;

        // 绘制四条虚线边
        for (let i = 0; i < width; i += spacing * 2) {
            // 上边框
            dropZone.strokeLineSegment(x + i, y, x + Math.min(i + spacing, width), y);
            // 下边框
            dropZone.strokeLineSegment(x + i, y + height, x + Math.min(i + spacing, width), y + height);
        }
        for (let i = 0; i < height; i += spacing * 2) {
            // 左边框
            dropZone.strokeLineSegment(x, y + i, x, y + Math.min(i + spacing, height));
            // 右边框
            dropZone.strokeLineSegment(x + width, y + i, x + width, y + Math.min(i + spacing, height));
        }

        // 创建实际的投放区域
        const boxZone = this.add.zone(150, 450, 200, 200)
            .setRectangleDropZone(200, 200);

        // 添加投放区域的交互效果
        boxZone.on('dragenter', () => {
            highlightZone.clear();
            highlightZone.fillStyle(0x4A90E2, 0.2);  // 加深高亮颜色
            highlightZone.fillRect(50, 350, 200, 200);
        });

        boxZone.on('dragleave', () => {
            highlightZone.clear();
            highlightZone.fillStyle(0x4A90E2, 0.1);  // 恢复原来的高亮颜色
            highlightZone.fillRect(50, 350, 200, 200);
        });

        // 添加动画效果
        this.tweens.add({
            targets: highlightZone,
            alpha: 0.5,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });
    }

    startGame() {
        this.isPlaying = true;
        this.gameStartTime = Date.now();
        
        // 开始计时
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

    // 封箱并移动的方法
    sealAndMoveBox() {
        // 如果已经达到目标数量，不再继续
        if (this.boxCount >= this.targetBoxCount) {
            return;
        }
         // 播放打包音效
         this.sound.play('package-sound', { volume: 0.8 });

        // 立即更新计数
        this.boxCount++;
        this.boxText.setText(`Box: ${this.boxCount}/${this.targetBoxCount}`);
        
        // 临时隐藏打开的箱子
        this.openBox.setVisible(false);
        
        // 创建一个封闭状态的箱子
        const sealedBox = this.add.image(
            this.openBox.x,
            this.openBox.y,
            'box-closed'
        ).setScale(this.scale.height*0.0004);
        
        // 标记箱子为移动状态
        sealedBox.isMoving = true;
        if (!this.movingBoxes) {
            this.movingBoxes = [];
        }
        this.movingBoxes.push(sealedBox);

        // 箱子动画序列
        this.tweens.add({
            targets: sealedBox,
            scaleX: 0.25,
            scaleY: 0.25,
            duration: 150,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.openBox.setVisible(true);

                this.tweens.add({
                    targets: sealedBox,
                    x: this.conveyor.x - this.conveyor.width * 0.25,
                    y: this.conveyor.y - 80, //表示传送的箱子的高低
                    duration: 300,
                    ease: 'Back.easeOut',
                    onComplete: () => {
                        this.tweens.add({
                            targets: sealedBox,
                            x: this.conveyor.x + this.conveyor.width * 0.5,
                            duration: 2000,
                            ease: 'Sine.easeInOut',
                            onComplete: () => {
                                this.tweens.add({
                                    targets: sealedBox,
                                    alpha: 0,
                                    y: sealedBox.y - 30,
                                    duration: 200,
                                    ease: 'Quad.easeIn',
                                    onComplete: () => {
                                        // 从移动箱子列表中移除
                                        const index = this.movingBoxes.indexOf(sealedBox);
                                        if (index > -1) {
                                            this.movingBoxes.splice(index, 1);
                                        }
                                        sealedBox.destroy();

                                        // 检查是否达到目标数量且所有箱子都完成移动
                                        if (this.boxCount >= this.targetBoxCount && this.movingBoxes.length === 0) {
                                            this.isPlaying = false;
                                            if (this.timer) {
                                                this.timer.destroy();
                                            }
                                            console.log('箱子的数量',this.boxCount,this.targetBoxCount, this.movingBoxes.length);
                                            this.onGameComplete();
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    // 打包动画
    playPackingAnimation() {
        this.isPackingAnimating = true;
        
        // 只添加打包相关的效果，不改变角色状态
        this.time.delayedCall(200, () => {
            this.isPackingAnimating = false;
        });
    }

    // 修改箱子打包计数逻辑
    onBoxPacked() {
        console.log('onBoxPacked called', this.isPlaying, this.isPackingAnimating);
        if (!this.isPlaying || this.isPackingAnimating) return;
        
        this.boxCount++;
        console.log('Box packed, current count:', this.boxCount);
        this.boxText.setText(`Box: ${this.boxCount}/${this.targetBoxCount}`);
        
        // 只在达到目标数量时禁用进一步打包，但不立即结束游戏
        if (this.boxCount >= this.targetBoxCount) {
            console.log('Box packed, current count:', this.boxCount);
            this.isPlaying = false;
            this.onGameComplete();
        }
    }

    onGameComplete() {
    if (this.bgm) {
            this.bgm.stop();
            this.bgm.destroy();
        }
        // 先显示完成界面
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        let medalLevel = null;
        console.log('onGameComplete called', elapsed);
        if (elapsed <= this.medalTimes.gold) {
            medalLevel = 'gold';
        } else if (elapsed <= this.medalTimes.silver) {
            medalLevel = 'silver';
        } else {
            medalLevel = 'bronze';
        }
        console.log('Medal level:', medalLevel);

        // 更新玩家奖励
        if (!window.gameState) window.gameState = {};
        if (!window.gameState.medals) window.gameState.medals = {};
        window.gameState.medals.ecommerce = medalLevel;
        
        // 显示完成界面并同时播放音效
        this.showCompletionMessage(medalLevel);
    }

    showCompletionMessage(medalLevel) {
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

    // 添加更新方法
    update() {
        if (this.isPlaying && this.cursors) {  // 添加 this.cursors 检查
            if (this.cursors.left.isDown) {
                this.player.x -= 4;
                this.player.setFlipX(true);
            }
            else if (this.cursors.right.isDown) {
                this.player.x += 4;
                this.player.setFlipX(false);
            }

            // 限制角色移动范围
            this.player.x = Phaser.Math.Clamp(
                this.player.x,
                100,
                this.cameras.main.width - 100
            );
        }
    }

    // 添加箱子提示动画
    addBoxHintAnimations() {
        // 1. 添加上下浮动动画
        this.tweens.add({
            targets: this.openBox,
            y: this.openBox.y - 10,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 2. 添加点击提示光圈
        const circle = this.add.circle(
            this.openBox.x,
            this.openBox.y,
            50,
            0xffff00,
            0.3
        );

        // 光圈动画
        this.tweens.add({
            targets: circle,
            scale: 1.5,
            alpha: 0,
            duration: 1000,
            repeat: -1,
            ease: 'Cubic.easeOut'
        });

        // 3. 添加发光效果（替代闪光效果）
        const glow = this.add.circle(
            this.openBox.x,
            this.openBox.y,
            30,
            0xffff00,
            0.6
        );

        this.tweens.add({
            targets: glow,
            alpha: 0,
            scale: 1.5,
            duration: 1500,
            repeat: -1,
            ease: 'Cubic.easeOut'
        });

        // 4. 当点击箱子时，移除所有提示动画
        this.openBox.on('pointerdown', () => {
            if (this.isPlaying) {
                // 移除提示效果
                circle.destroy();
                glow.destroy();
                // 重置箱子位置
                this.openBox.y = this.conveyor.y - this.conveyor.displayHeight * 0.3;
            }
        });
    }

    // 在 preload 中确保加载所需资源
    preload() {
        this.load.setBaseURL('assets/');
        
        // 加载背景音乐（确保文件名大小写正确）
        this.load.audio('ecommerce-bgm', 'audio/EcommerceScene.mp3');
        
        // 加载场景基础资源
        this.load.image('ecommerce-bg', 'images/scenes/ecommerce/background.png');  // 背景图
        this.load.image('box-open', 'images/scenes/ecommerce/box-open.png');        // 打开状态的箱子
        this.load.image('box-closed', 'images/scenes/ecommerce/box-closed.png');    // 关闭状态的箱子
        this.load.image('conveyor', 'images/scenes/ecommerce/conveyor.png');        // 传送带
        
        // 加载通用资源
        this.load.image('back', 'images/common/back.png');                          // 返回按钮
                        // 按钮背景
        
        // 加载奖牌和完成界面相关资源
        this.load.image('gold', 'images/common/gold.png');
        this.load.image('silver', 'images/common/silver.png');
        this.load.image('bronze', 'images/common/bronze.png');
        this.load.image('try-again-btn', 'images/common/try-again.png');
        this.load.image('other-games-btn', 'images/common/other-games.png');
        this.load.image('reward-bg', 'images/common/reward-bg.png');
        this.load.audio('finish', 'audio/finish.mp3');
        
        // 加载打包音效
        this.load.audio('package-sound', 'audio/package.mp3');
    }

    // 添加一个窗口大小变化的监听器
    resize() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 更新角色位置和大小
        this.player.setPosition(width * 0.10, height * 0.75)
            .setScale(height * 0.001);

        // 更新传送带位置和大小
        if (this.conveyor) {
            this.conveyor.setPosition(width * 0.26, height * 0.65)
                .setScale(height * 0.001);
        }

        // 更新箱子位置和大小
        if (this.openBox) {
            this.openBox.setPosition(width * 0.2, height * 0.65)
                .setScale(height * 0.001);
        }

        // 更新返回按钮位置
        this.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'back') {
                child.setPosition(this.scale.width * 0.05, this.scale.height * 0.1);
            }
        });
    }

    // 在场景重启或切换时清理动画
    shutdown() {
        if (this.timer) {
            this.timer.remove();
        }
        if (this.bgm) {
            this.bgm.stop();
            this.bgm.destroy();
        }
        super.shutdown();
    }

    // 修改 resetGameState 方法
    resetGameState() {
        // 重置基本状态
        this.isPlaying = false;
        this.score = 0;
        this.boxCount = 0;        // 已完成的箱子数重置为0
        this.targetBoxCount = 20; // 目标箱子数保持20
        this.gameStartTime = 0;
        this.isPackingAnimating = false;

        // 清理之前的动画
        if (this.timer) {
            this.timer.remove();
        }

        // 清理之前的完成界面元素
        if (this.completionElements) {
            this.completionElements.forEach(element => element.destroy());
            this.completionElements = [];
        }

        // 移除按钮状态重置，将其移到 create 方法中
    }

    // init 方法只重置状态，不涉及 UI
    init() {
        // 只重置游戏状态数据，不涉及UI元素
        this.resetGameState();
    }

    // 场景暂停时处理
    pause() {
        if (this.bgm) {
            this.bgm.pause();
        }
    }

    // 场景恢复时处理
    resume() {
        if (this.bgm && !this.bgm.isPlaying) {
            this.bgm.resume();
        }
    }
}
