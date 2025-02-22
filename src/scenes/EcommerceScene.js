import { playerManager } from '../managers/PlayerManager.js';

export default class EcommerceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EcommerceScene' });
        
        // 初始化游戏状态
        if (!window.gameState) {
            window.gameState = {};
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
        this.resetGameState();

        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 添加背景图并设置为全屏
        this.add.image(width/2, height/2, 'ecommerce-bg')
            .setDisplaySize(width, height)
            .setDepth(-1);

        // 创建背景音乐
        this.bgm = this.sound.add('ecommerce-bgm', { 
            loop: true,
            volume: 0.5
        });

        // 尝试直接播放
        this.bgm.play();

        // 如果直接播放失败，使用备用方案
        if (!this.bgm.isPlaying) {
            // 创建一个隐藏的按钮来触发音频
            const hiddenButton = document.createElement('button');
            hiddenButton.style.position = 'absolute';
            hiddenButton.style.top = '0';
            hiddenButton.style.left = '0';
            hiddenButton.style.width = '100%';
            hiddenButton.style.height = '100%';
            hiddenButton.style.opacity = '0';
            hiddenButton.style.cursor = 'default';
            document.body.appendChild(hiddenButton);

            // 确保 AudioContext 已经准备好
            const resumeAudioContext = () => {
                const context = this.sound.context;
                // 恢复 AudioContext
                if (context.state === 'suspended') {
                    context.resume();
                }
                // 播放背景音乐
                this.bgm.play();
                // 移除按钮和事件监听
                document.body.removeChild(hiddenButton);
            };

            // 添加真实的点击事件监听
            hiddenButton.addEventListener('click', resumeAudioContext);

            // 模拟点击
            requestAnimationFrame(() => {
                hiddenButton.dispatchEvent(new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                }));
            });
        }

        // 首先放置角色，作为参考点
        const characterType = window.gameState.character || 'female';
        this.player = this.add.sprite(
            width * 0.2,  // 调整到左侧20%处
            height * 0.65,  // 调整到65%的高度
            characterType
        )
        .setScale(height * 0.001)
        .setDepth(2);  // 确保角色在最上层

        // 传送带位置和尺寸调整
        this.conveyor = this.add.image(
            width * 0.6,  // 中心点位于60%处
            height * 0.75,  // 调整传送带高度
            'conveyor'
        )
        .setDisplaySize(width * 0.8, height * 0.1)  // 增加传送带宽度到80%屏幕宽度
        .setDepth(0);

        // 调整箱子位置，使其位于角色脚下
        this.openBox = this.add.image(
            this.player.x + width * 0.02,  // 略微偏右
            this.player.y + height * 0.08,  // 位于角色脚下
            'box-open'
        )
        .setScale(height * 0.0006)
        .setInteractive()
        .setDepth(1);  // 确保箱子在角色和传送带之间

        // 创建 UI 文本
        this.timeText = this.add.text(width - 200, 20, 'Time: 0s', {
            fontSize: '24px',
            fill: '#000',
            backgroundColor: '#ffffff80',
            padding: { x: 15, y: 8 }
        }).setDepth(2);

        this.boxText = this.add.text(width - 200, 70, `Box: ${this.boxCount}/${this.targetBoxCount}`, {
            fontSize: '24px',
            fill: '#000',
            backgroundColor: '#ffffff80',
            padding: { x: 15, y: 8 }
        }).setDepth(2);

        // 修改返回按钮实现
        const backButton = this.add.image(80, 40, 'back')
            .setScale(0.6)
            .setDepth(2)
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('SceneSelectScene');
            });

        // 添加悬停效果
        backButton.on('pointerover', () => {
            backButton.setScale(0.65);
        });

        backButton.on('pointerout', () => {
            backButton.setScale(0.6);
        });

        // 初始化键盘控制
        this.cursors = this.input.keyboard.createCursorKeys();

        // 添加箱子的提示动画
        this.addBoxHintAnimations();

        // 添加箱子的点击事件
        this.openBox.on('pointerover', () => {
            this.openBox.setTint(0x88ff88);
        });
        
        this.openBox.on('pointerout', () => {
            this.openBox.clearTint();
        });

        this.openBox.on('pointerdown', () => {
            if (!this.isPlaying || this.isPackingAnimating) return;
            
            // 暂停背景音乐
            this.bgm.pause();
            
            this.playPackingAnimation();
            this.sealAndMoveBox();
            
            // 动画完成后恢复背景音乐
            this.time.delayedCall(2500, () => {
                if (this.bgm && !this.bgm.isPlaying) {
                    this.bgm.resume();
                }
            });
        });

        this.showStartPrompt();
    }

    showStartPrompt() {
        // 直接开始游戏，不显示提示文本
        this.isPlaying = true;
        this.gameStartTime = Date.now();
        
        // 开始计时
        this.timer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
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
                glow.destroy();
                // 重置箱子位置
                this.openBox.y = this.conveyor.y - this.conveyor.displayHeight * 0.3;
            }
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
        ).setScale(0.4);
        
        // 标记箱子为移动状态
        sealedBox.isMoving = true;
        if (!this.movingBoxes) {
            this.movingBoxes = [];
        }
        this.movingBoxes.push(sealedBox);

        // 箱子动画序列
        this.tweens.add({
            targets: sealedBox,
            scaleX: 0.45,
            scaleY: 0.35,
            duration: 150,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.openBox.setVisible(true);

                this.tweens.add({
                    targets: sealedBox,
                    x: this.conveyor.x - this.conveyor.width * 0.18,
                    y: this.conveyor.y - 100,
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
        if (!this.isPlaying || this.isPackingAnimating) return;
        
        this.boxCount++;
        this.boxText.setText(`Box: ${this.boxCount}/${this.targetBoxCount}`);
        
        // 只在达到目标数量时禁用进一步打包，但不立即结束游戏
        if (this.boxCount >= this.targetBoxCount) {
            this.isPlaying = false;
        }
    }

    showCompletionMessage(medal) {
        this.isPlaying = false;
        
        // 清理之前可能存在的完成界面元素
        if (this.completionElements) {
            this.completionElements.forEach(element => element.destroy());
        }
        this.completionElements = [];

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
        if (!window.gameState) window.gameState = {};
        if (!window.gameState.medals) window.gameState.medals = {};
        window.gameState.medals.ecommerce = medalLevel;

        // 添加奖励背景
        const bg = this.add.image(this.scale.width/2, this.scale.height/2, 'reward-bg')
            .setDisplaySize(this.scale.width, this.scale.height)
            .setDepth(5);
        this.completionElements.push(bg);

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
        this.completionElements.push(title);

        // 添加奖牌图片
        const medalImage = this.add.image(this.scale.width/2, this.scale.height * 0.45, `${medalLevel}-medal`)
            .setScale(0.4)
            .setDepth(6);
        this.completionElements.push(medalImage);

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
        this.completionElements.push(passText);

        // 添加完成时间文本
        const timeText = this.add.text(this.scale.width/2, this.scale.height * 0.75, 
            `完成时间: ${elapsed}秒`, {
            fontSize: '24px',
            fill: '#FFFFFF'
        })
        .setOrigin(0.5)
        .setDepth(6);
        this.completionElements.push(timeText);

        // 添加按钮
        const buttonY = this.scale.height * 0.85;
        const buttonSpacing = 150;

        // 再试一次按钮
        const tryAgainBtn = this.add.image(this.scale.width/2 - buttonSpacing, buttonY, 'try-again-btn')
            .setScale(0.8)
            .setInteractive()
            .setDepth(6);
        this.completionElements.push(tryAgainBtn);

        // 其他游戏按钮
        const otherGamesBtn = this.add.image(this.scale.width/2 + buttonSpacing, buttonY, 'other-games-btn')
            .setScale(0.8)
            .setInteractive()
            .setDepth(6);
        this.completionElements.push(otherGamesBtn);

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

        // 清理之前的动画
        if (this.medalTween) {
            this.medalTween.stop();
            this.medalTween.remove();
        }
        if (this.medalBounceTween) {
            this.medalBounceTween.stop();
            this.medalBounceTween.remove();
        }

        // 添加奖牌动画效果
        this.medalTween = this.tweens.add({
            targets: medalImage,
            scale: { from: 0.2, to: 0.4 },
            duration: 1000,
            ease: 'Back.out',
            onComplete: () => {
                this.medalBounceTween = this.tweens.add({
                    targets: medalImage,
                    scale: { from: 0.4, to: 0.425 },
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        // 停止背景音乐
        if (this.bgm) {
            this.bgm.stop();
        }
    }

    // 辅助方法：获取奖牌价值用于比较
    getMedalValue(medalType) {
        const values = {
            'gold': 3,
            'silver': 2,
            'bronze': 1,
            null: 0
        };
        return values[medalType] || 0;
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
        this.load.image('button', 'images/common/button.png');                      // 按钮背景
        
        // 加载奖牌和完成界面相关资源
        this.load.image('gold-medal', 'images/common/gold.png');
        this.load.image('silver-medal', 'images/common/silver.png');
        this.load.image('bronze-medal', 'images/common/bronze.png');
        this.load.image('try-again-btn', 'images/common/try-again.png');
        this.load.image('other-games-btn', 'images/common/other-games.png');
    }

    // 添加一个窗口大小变化的监听器
    resize() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 更新角色位置和大小
        this.player.setPosition(width * 0.2, height * 0.65)
            .setScale(height * 0.001);

        // 更新传送带位置和大小
        this.conveyor.setPosition(width * 0.6, height * 0.75)
            .setDisplaySize(width * 0.8, height * 0.1);

        // 更新箱子位置和大小
        this.openBox.setPosition(
            this.player.x + width * 0.02,
            this.player.y + height * 0.08
        )
        .setScale(height * 0.0006);

        // 更新返回按钮位置
        this.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'back') {
                child.setPosition(80, 40);
            }
        });
    }

    onGameComplete() {
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
        playerManager.updateGameMedal('ecommerce', medal);

        // 显示完成消息
        this.showCompletionMessage(medal);
    }

    // 在场景重启或切换时清理动画
    shutdown() {
        if (this.medalTween) {
            this.medalTween.stop();
            this.medalTween.remove();
        }
        if (this.medalBounceTween) {
            this.medalBounceTween.stop();
            this.medalBounceTween.remove();
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
        if (this.medalTween) {
            this.medalTween.stop();
            this.medalTween.remove();
        }
        if (this.medalBounceTween) {
            this.medalBounceTween.stop();
            this.medalBounceTween.remove();
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
