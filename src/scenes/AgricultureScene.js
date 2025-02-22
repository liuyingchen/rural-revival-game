import { playerManager } from '../managers/PlayerManager.js';

export default class AgricultureScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AgricultureScene' });
        this.airplane = null;
        this.isPlaying = false;
        this.fieldProgress = 0;
        this.width = 0;
        this.height = 0;
        this.clickCount = 0;      // 记录点击次数
        this.targetClicks = 30;   // 目标点击次数
        this.lastEffectTime = 0;  // 上次效果生成时间
        this.isAirplaneFlying = false;  // 新增：标记无人机是否在飞行
        this.isFirstFlight = false;  // 添加首次飞行标记
        this.medalTimes = {
            gold: 30,
            silver: 45,
            bronze: 60
        };
    }

    create() {
        this.width = this.cameras.main.width;
        this.height = this.cameras.main.height;

        // 添加背景和遮罩
        this.add.image(this.width/2, this.height/2, 'agriculture-bg')
            .setDisplaySize(this.width, this.height)
            .setDepth(-2);

        this.createField();

        // 添加选中的角色（保持在左侧）
        const characterType = window.gameState.character || 'female';
        this.player = this.add.sprite(
            this.scale.width * 0.15,  // 水平位置在屏幕15%处
            this.scale.height * 0.8,   // 垂直位置在屏幕70%处
            characterType
        )
        .setScale(this.scale.height * 0.001)  // 根据屏幕高度设置缩放
        .setDepth(99);  // 确保角色在最上层

        // 添加无人机
        this.airplane = this.add.sprite(this.width * 0.5, this.height * 0.9, 'airplane')
            .setScale(0.3)
            .setDepth(1);

        // 添加返回按钮（只保留这一个）
        const backButton = this.add.image(80, 40, 'back')
            .setScale(0.6)
            .setDepth(2)
            .setInteractive()
            .on('pointerdown', () => {
                this.scene.start('SceneSelectScene');
            });
        
        // 重置游戏状态
        this.isPlaying = false;
        this.clickCount = 0;
        this.fieldProgress = 0;
        this.updateFieldMask();  // 确保遮罩重置
        
        this.addAirplaneHintEffects();
        
        // 延迟2秒后显示弹窗
        this.time.delayedCall(1000, () => {
            this.showWelcomeDialog();
        });

        // 添加点击监听
        this.input.on('pointerdown', (pointer) => {
            if (this.isPlaying) {
                this.handleClick(pointer.x, pointer.y);
            }
        });

        // 确保在 preload 中加载 sparkle 图片
    

        // 添加无人机提示动画
        this.addDroneHintAnimations();

        // 添加时间显示
        this.timeText = this.add.text(this.width - 150, 20, '时间: 0秒', {
            fontSize: '24px',
            fill: '#000',
            backgroundColor: '#ffffff80',
            padding: { x: 10, y: 5 }
        }).setDepth(2);

        // 初始化游戏时间
        this.gameTime = 0;
        this.gameTimer = null;
    }

    handleClick(x, y) {
        // 只有在无人机飞行状态下且不是首次点击时才响应点击
        if (!this.isAirplaneFlying || this.isFirstFlight) {
            return;
        }

        this.clickCount++;
        this.lastEffectTime = Date.now();
        
        // 如果有正在播放的操作音效，先停止它
        if (this.currentActionSound) {
            this.currentActionSound.stop();
            this.currentActionSound.destroy();
        }
        
        // 播放新的操作音效
        this.currentActionSound = this.sound.add('action', { 
            volume: 0.6,
            loop: false
        });
        this.currentActionSound.play();
        
        // 音效播放完成后清理资源
        this.currentActionSound.once('complete', () => {
            if (this.currentActionSound) {
                this.currentActionSound.destroy();
                this.currentActionSound = null;
            }
        });
        
        // 创建浇水或施肥效果
        if (Math.random() < 0.5) {
            this.createWaterEffect(this.airplane.x, this.airplane.y + 20);
        } else {
            this.createFertilizeEffect(this.airplane.x, this.airplane.y + 20);
        }

        this.fieldProgress = Math.min(this.clickCount / this.targetClicks, 1);
        this.updateFieldMask();

        if (this.clickCount >= this.targetClicks) {
            // 停止所有其他音效
            if (this.bgm) {
                this.bgm.stop();
                this.bgm.destroy();
                this.bgm = null;
            }
            if (this.currentActionSound) {
                this.currentActionSound.stop();
                this.currentActionSound.destroy();
                this.currentActionSound = null;
            }
            if (this.flySound) {
                this.flySound.stop();
                this.flySound.destroy();
                this.flySound = null;
            }
            this.showCompletionMessage();
        }
    }

    startOperation() {
        // 确保清理所有提示动画
        this.clearHintEffects();
        
        this.tweens.killTweensOf(this.airplane);
        this.isFirstFlight = true;
        
        // 起飞动画
        this.tweens.add({
            targets: this.airplane,
            y: this.height * 0.6,
            duration: 1500,
            ease: 'Quad.out',
            onComplete: () => {
                this.startRandomFlight();
                this.time.delayedCall(500, () => {
                    this.isFirstFlight = false;
                });
            }
        });
    }

    startRandomFlight() {
        const generateRandomPoint = () => ({
            x: Phaser.Math.Between(this.width * 0.1, this.width * 0.9),
            y: Phaser.Math.Between(this.height * 0.2, this.height * 0.6)
        });

        const moveToNextPoint = () => {
            if (this.isPlaying) {
                const target = generateRandomPoint();
                const distance = Phaser.Math.Distance.Between(
                    this.airplane.x, this.airplane.y,
                    target.x, target.y
                );
                
                this.tweens.add({
                    targets: this.airplane,
                    x: target.x,
                    y: target.y,
                    duration: distance * 3,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        if (this.isPlaying) {
                            moveToNextPoint();
                        }
                    }
                });
            }
        };

        moveToNextPoint();
    }

    showCompletionMessage() {
        this.isPlaying = false;
        this.isAirplaneFlying = false;
        
        // 停止计时器
        if (this.gameTimer) {
            this.gameTimer.remove();
        }

        // 确定奖牌等级
        let medal = null;
        if (this.gameTime <= 20) {
            medal = 'gold';
        } else if (this.gameTime <= 30) {
            medal = 'silver';
        } else {
            medal = 'bronze';
        }

        // 更新玩家奖励
        playerManager.updateGameMedal('agriculture', medal);

        // 添加奖励背景
        const bg = this.add.image(this.width/2, this.height/2, 'reward-bg')
            .setDisplaySize(this.width, this.height)
            .setDepth(5);

        // 添加 CONGRATULATIONS 标题
        const title = this.add.text(this.width/2, this.height * 0.2, 'CONGRATULATIONS', {
            fontSize: '48px',
            fontWeight: 'bold',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 6
        })
        .setOrigin(0.5)
        .setDepth(6);

        // 修改奖牌图片的大小
        const medalImage = this.add.image(this.width/2, this.height * 0.45, `${medal}`)
            .setScale(0.4)  // 从 0.8 改为 0.4
            .setDepth(6);

        // 添加 GOLDEN PASS 文本（或对应的银牌、铜牌文本）
        const passText = this.add.text(this.width/2, this.height * 0.65, 
            `${medal.toUpperCase()} PASS`, {
            fontSize: '36px',
            fontWeight: 'bold',
            fill: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
        })
        .setOrigin(0.5)
        .setDepth(6);

        // 添加完成时间文本
        const timeText = this.add.text(this.width/2, this.height * 0.75, 
            `完成时间: ${this.gameTime}秒`, {
            fontSize: '24px',
            fill: '#FFFFFF'
        })
        .setOrigin(0.5)
        .setDepth(6);

        // 添加按钮
        const buttonY = this.height * 0.85;
        const buttonSpacing = 150;

        // 再试一次按钮
        const tryAgainBtn = this.add.image(this.width/2 - buttonSpacing, buttonY, 'try-again-btn')
            .setScale(0.8)
            .setInteractive()
            .setDepth(6);

        // 其他游戏按钮
        const otherGamesBtn = this.add.image(this.width/2 + buttonSpacing, buttonY, 'other-games-btn')
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

        // 修改再试一次按钮的点击事件
        tryAgainBtn.on('pointerdown', () => {
            // 直接重启当前场景
            this.scene.restart();
        });

        otherGamesBtn.on('pointerdown', () => {
            this.scene.start('SceneSelectScene');
        });

        // 修改奖牌动画效果的缩放值
        this.tweens.add({
            targets: medalImage,
            scale: { from: 0.2, to: 0.4 },  // 从 0.4->0.8 改为 0.2->0.4
            duration: 1000,
            ease: 'Back.out',
            onComplete: () => {
                // 添加闪光效果，同样调整缩放范围
                this.tweens.add({
                    targets: medalImage,
                    scale: { from: 0.4, to: 0.425 },  // 从 0.8->0.85 改为 0.4->0.425
                    duration: 1500,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

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
    }

    createField() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.field = this.add.graphics();
        
        this.updateFieldMask = () => {
            this.field.clear();
            
            // 调整遮罩范围为屏幕底部28%（实际32%包含渐变）
            const startY = height * 0.68;  // 从68%的位置开始，留出4%的渐变空间
            const fieldHeight = height * 0.32;  // 占32%的高度，包含渐变区域
            const steps = 30;
            
            for (let i = 0; i < steps; i++) {
                const stepHeight = fieldHeight / steps;
                let alpha;
                
                if (i < steps * 0.15) {  // 前15%步数用于顶部渐变
                    // 从完全透明到目标透明度的渐变
                    alpha = (i / (steps * 0.15)) * 0.5 * (1 - this.fieldProgress);
                } else {
                    // 主体部分的透明度
                    alpha = 0.5 * (1 - this.fieldProgress);
                }
                
                this.field.fillStyle(0xF4D03F, alpha);
                this.field.fillRect(
                    0, 
                    startY + (i * stepHeight), 
                    width, 
                    stepHeight + 1
                );
            }
        };
        
        this.field.setDepth(-1);
        this.updateFieldMask();
    }

    updateFieldProgress() {
        // 根据当前轮次更新进度
        const targetProgress = this.currentRound / 3;
        
        // 缓慢更新进度
        this.tweens.add({
            targets: this,
            fieldProgress: targetProgress,
            duration: 1500,  // 增加过渡时间
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                this.updateFieldMask();
            }
        });
    }

    addAirplaneHintEffects() {
        // 创建光晕效果
        const glow = this.add.graphics();
        glow.lineStyle(2, 0xffff00, 0.5);
        glow.strokeCircle(this.airplane.x, this.airplane.y, 40);

        // 光晕动画
        this.tweens.add({
            targets: glow,
            alpha: 0,
            scale: 1.5,
            duration: 1000,
            repeat: -1,
            yoyo: true
        });

        // 无人机呼吸效果
        this.tweens.add({
            targets: this.airplane,
            scaleX: 0.33,
            scaleY: 0.33,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 无人机上下浮动
        this.tweens.add({
            targets: this.airplane,
            y: this.airplane.y - 15,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 点击事件
        this.airplane.setInteractive();
        this.airplane.on('pointerover', () => {
            this.airplane.setTint(0x88ff88);
        });
        
        this.airplane.on('pointerout', () => {
            this.airplane.clearTint();
        });

        this.airplane.on('pointerdown', () => {
            if (this.isPlaying && !this.isAirplaneFlying) {
                // 移除所有提示效果
                glow.destroy();
                this.airplane.clearTint();
                
                // 停止所有当前动画
                this.tweens.killTweensOf(this.airplane);
                
                // 开始飞行
                this.isAirplaneFlying = true;
                this.startOperation();
            }
        });
    }

    createSeedEffect(x, y) {
        // 移除随机概率检查，改为连续生成
        for (let i = 0; i < 3; i++) {  // 增加种子数量
            const seed = this.add.graphics();
            seed.fillStyle(0x654321, 1);
            seed.fillCircle(0, 0, 2);
            
            // 随机初始位置和速度
            seed.x = x + Phaser.Math.Between(-40, 40);
            seed.y = y;
            
            // 为每个种子设置随机的初始速度
            const vx = Phaser.Math.FloatBetween(-0.2, 0.2);
            let vy = Phaser.Math.FloatBetween(3, 4);  // 随机初始下落速度
            const gravity = 0.15;
            
            const update = () => {
                vy += gravity;
                seed.y += vy;
                seed.x += vx;
                
                if (seed.y > this.cameras.main.height * 0.68) {
                    // 创建落地效果
                    const landEffect = this.add.graphics();
                    landEffect.fillStyle(0x654321, 0.3);
                    landEffect.fillCircle(seed.x, seed.y, 3);
                    
                    this.tweens.add({
                        targets: landEffect,
                        alpha: 0,
                        duration: 300,
                        onComplete: () => landEffect.destroy()
                    });
                    
                    seed.destroy();
                    this.events.off('update', update);
                }
            };
            
            this.events.on('update', update);
        }
    }

    createWaterEffect(x, y) {
        // 增加到12个水滴
        for (let i = 0; i < 12; i++) {
            const drop = this.add.graphics();
            const dropSize = Phaser.Math.FloatBetween(3, 4);
            
            drop.clear();
            drop.fillStyle(0x4444ff, 0.8);
            drop.fillEllipse(0, 0, dropSize, dropSize * 1.5);
            
            // 设置水滴初始位置
            drop.x = x + Phaser.Math.Between(-30, 30);
            drop.y = y + Phaser.Math.Between(-8, 8);
            
            // 修改下落动画，模拟自由落体
            const targetY = y + this.height * 0.6;  // 延长下落距离到底部1/4处
            const duration = 1000;  // 增加下落时间

            this.tweens.add({
                targets: drop,
                y: {
                    value: targetY,
                    duration: duration,
                    ease: 'Quad.in'  // 使用 Quad.in 更好地模拟重力加速
                },
                x: {
                    value: drop.x + Phaser.Math.Between(-3, 3),  // 减少水平移动
                    duration: duration,
                    ease: 'Linear'
                },
                alpha: {
                    value: 0,
                    duration: duration * 0.3,  // 缩短消失时间
                    ease: 'Linear',
                    delay: duration * 0.7  // 延迟到接近底部才开始消失
                },
                onComplete: () => {
                    drop.destroy();
                }
            });
        }
    }

    createWaterSplash(x, y) {
        // 创建更大的水花效果
        const splash = this.add.graphics();
        splash.fillStyle(0x4A90E2, 0.4);
        
        const radius = 5;
        splash.fillCircle(x, y, radius);
        
        // 添加波纹效果
        for (let i = 0; i < 3; i++) {
            const ripple = this.add.graphics();
            ripple.lineStyle(1, 0x4A90E2, 0.3);
            ripple.strokeCircle(x, y, radius);
            
            this.tweens.add({
                targets: ripple,
                scaleX: 2 + i,
                scaleY: 0.5,
                alpha: 0,
                duration: 400 + i * 100,
                ease: 'Quad.out',
                onComplete: () => ripple.destroy()
            });
        }
        
        // 主水花消失
        this.tweens.add({
            targets: splash,
            scaleX: 3,
            scaleY: 0.4,
            alpha: 0,
            duration: 300,
            ease: 'Quad.out',
            onComplete: () => splash.destroy()
        });
    }

    createFertilizeEffect(x, y) {
        // 增加到12个肥料粒子
        for (let i = 0; i < 12; i++) {
            const particle = this.add.circle(
                x + Phaser.Math.Between(-25, 25),
                y + Phaser.Math.Between(-8, 8),
                Phaser.Math.FloatBetween(1.5, 3),
                0x8B4513,
                0.8
            );
            
            // 修改下落动画，模拟自由落体
            const targetY = y + this.height * 0.6;  // 延长下落距离到底部1/4处
            const duration = 1200;  // 增加下落时间

            this.tweens.add({
                targets: particle,
                y: {
                    value: targetY,
                    duration: duration,
                    ease: 'Quad.in'  // 使用 Quad.in 更好地模拟重力加速
                },
                x: {
                    value: particle.x + (Math.random() - 0.5) * 30,  // 减少水平移动
                    duration: duration,
                    ease: 'Linear'
                },
                alpha: {
                    value: 0,
                    duration: duration * 0.3,  // 缩短消失时间
                    ease: 'Linear',
                    delay: duration * 0.7  // 延迟到接近底部才开始消失
                },
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }

    createFertilizerSplash(x, y) {
        // 创建肥料落地效果
        const splash = this.add.graphics();
        splash.fillStyle(0x8B4513, 0.4);
        
        // 创建不规则的落地形状
        splash.beginPath();
        splash.arc(x, y, 3, 0, Math.PI * 2);
        splash.closePath();
        splash.fill();
        
        // 添加扩散效果
        const dustParticles = [];
        for (let i = 0; i < 4; i++) {
            const dust = this.add.graphics();
            dust.fillStyle(0x8B4513, 0.2);
            dust.fillCircle(x + Phaser.Math.Between(-3, 3), 
                           y + Phaser.Math.Between(-3, 3), 
                           2);
            dustParticles.push(dust);
        }
        
        // 扩散动画
        dustParticles.forEach((dust, index) => {
            this.tweens.add({
                targets: dust,
                x: dust.x + Phaser.Math.Between(-10, 10),
                y: dust.y + Phaser.Math.Between(-5, 5),
                alpha: 0,
                duration: 300 + index * 50,
                ease: 'Quad.out',
                onComplete: () => dust.destroy()
            });
        });
        
        // 主效果消失
        this.tweens.add({
            targets: splash,
            alpha: 0,
            duration: 400,
            ease: 'Quad.out',
            onComplete: () => splash.destroy()
        });
    }

    showWelcomeDialog() {
        // 创建半透明黑色背景
        const overlay = this.add.graphics()
            .setDepth(98);  // 设置深度为98
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, this.scale.width, this.scale.height);

        // 修改弹窗尺寸和位置
        const boxWidth = this.scale.width * 0.9;     // 弹窗宽度为屏幕宽度的80%
        const boxHeight = this.scale.height * 0.25;   // 弹窗高度为屏幕高度的25%
        const boxY = this.scale.height * 0.75;        // 弹窗垂直位置在屏幕75%的位置

        // 创建弹窗背景
        const messageBox = this.add.graphics()
            .setDepth(98);  // 设置深度为98
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

        // 确保角色在弹窗前面
        if (this.player) {
            this.player.setDepth(99);  // 设置角色深度为99，确保在弹窗之上
        }

        // 创建文本对象（设置深度为98，与弹窗同层）
        const textLines = [
            '欢迎来到现代化农业示范基地！',
            '你将操控智能无人机进行农田管理。',
            '点击无人机起飞后，快速点击屏幕进行浇水和施肥。',
            '准备好了吗？点击任意位置开始！'
        ];

        const textObjects = [];
        const startY = boxY - boxHeight/2 + 40;
        const lineSpacing = 30;

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
            .setAlpha(0)
            .setDepth(98);  // 设置文本深度为98

            textObjects.push(text);
        });

        // 为每行文本添加渐入动画，并实现逐行显示效果
        textObjects.forEach((textObj, index) => {
            this.tweens.add({
                targets: textObj,
                alpha: { from: 0, to: 1 },
                y: { from: textObj.y + 20, to: textObj.y },
                duration: 500,
                ease: 'Power2',
                delay: index * 500,  // 每行延迟显示
                onComplete: () => {
                    // 如果不是最后一行，开始下一行的显示
                    if (index < textObjects.length - 1) {
                        textObjects[index + 1].setVisible(true);
                    }
                }
            });
        });

        // 创建并播放背景音乐
        try {
            this.bgm = this.sound.add('agriculture-bgm', { 
                loop: true,
                volume: 0.5
            });

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

            const resumeAudioContext = () => {
                const context = this.sound.context;
                if (context.state === 'suspended') {
                    context.resume();
                }
                this.bgm.play();
                document.body.removeChild(hiddenButton);
            };

            hiddenButton.addEventListener('click', resumeAudioContext);
            requestAnimationFrame(() => {
                hiddenButton.dispatchEvent(new MouseEvent('click', {
                    view: window,
                    bubbles: true,
                    cancelable: true
                }));
            });
        } catch (error) {
            console.error('Failed to load or play audio:', error);
        }

        // 点击任意位置关闭弹窗
        const closeDialog = () => {
            // 文本淡出动画
            textObjects.forEach((textObj, index) => {
                this.tweens.add({
                    targets: textObj,
                    alpha: 0,
                    y: textObj.y + 10,
                    duration: 300,
                    ease: 'Power2',
                    delay: index * 100
                });
            });

            // 弹窗和阴影背景淡出动画
            this.tweens.add({
                targets: [messageBox, overlay],  // 同时处理弹窗和阴影
                alpha: 0,
                duration: 300,
                ease: 'Power2',
                delay: textObjects.length * 100,
                onComplete: () => {
                    // 清理所有元素
                    messageBox.destroy();
                    overlay.destroy();
                    textObjects.forEach(text => text.destroy());
                    
                    // 开始游戏
                    this.isPlaying = true;
                    this.isAirplaneFlying = false;
                    this.isFirstFlight = false;
                    this.clickCount = 0;
                    this.fieldProgress = 0;
                    this.updateFieldMask();
                    
                    // 开始计时
                    this.gameStartTime = Date.now();
                    this.gameTimer = this.time.addEvent({
                        delay: 1000,
                        callback: this.updateTimer,
                        callbackScope: this,
                        loop: true
                    });
                }
            });

            // 移除点击事件
            this.input.off('pointerdown', closeDialog);
        };

        this.input.on('pointerdown', closeDialog);
    }

    updateTimer() {
        if (this.isPlaying) {
            this.gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
            this.timeText.setText(`时间: ${this.gameTime}秒`);
        }
    }

    endGame() {
        // 实现游戏结束逻辑
        console.log('游戏结束');
    }

    // 添加无人机提示动画
    addDroneHintAnimations() {
        // 存储动画和效果的引用，以便后续移除
        this.hintEffects = {
            circle: null,
            flash: null,
            animations: []
        };

        // 1. 添加上下浮动动画
        const floatAnim = this.tweens.add({
            targets: this.airplane,
            y: this.airplane.y - 10,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        this.hintEffects.animations.push(floatAnim);

        // 2. 添加点击提示光圈
        const circle = this.add.circle(
            this.airplane.x,
            this.airplane.y,
            50,
            0xffff00,
            0.3
        );
        this.hintEffects.circle = circle;

        // 光圈动画
        const circleAnim = this.tweens.add({
            targets: circle,
            scale: 1.5,
            alpha: 0,
            duration: 1000,
            repeat: -1,
            ease: 'Cubic.easeOut'
        });
        this.hintEffects.animations.push(circleAnim);

        // 3. 添加闪光效果
        const flash = this.add.image(
            this.airplane.x,
            this.airplane.y,
            'sparkle'
        ).setScale(0.3).setAlpha(0.6);
        this.hintEffects.flash = flash;

        const flashAnim = this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 0.5,
            duration: 1500,
            repeat: -1,
            ease: 'Cubic.easeOut'
        });
        this.hintEffects.animations.push(flashAnim);

        // 4. 当点击无人机时，移除提示动画并开始飞行
        this.airplane.setInteractive().on('pointerdown', () => {
            if (this.isPlaying && !this.isAirplaneFlying) {
                // 停止并清理所有提示动画和效果
                this.clearHintEffects();
                
                // 确保停止并销毁背景音乐
                if (this.bgm) {
                    this.bgm.stop();
                    this.bgm.destroy();
                    this.bgm = null;
                }

                // 播放一次性飞行音效
                this.flySound = this.sound.add('fly', { 
                    volume: 0.8,
                    loop: false
                });
                this.flySound.play();
                
                // 音效播放完成后清理资源
                this.flySound.once('complete', () => {
                    if (this.flySound) {
                        this.flySound.destroy();
                        this.flySound = null;
                    }
                });
                
                // 开始飞行操作
                this.isAirplaneFlying = true;
                this.startOperation();
            }
        });
    }

    // 添加清理提示效果的方法
    clearHintEffects() {
        if (this.hintEffects) {
            // 停止所有动画
            this.hintEffects.animations.forEach(anim => {
                if (anim) anim.stop();
            });

            // 移除视觉效果
            if (this.hintEffects.circle) this.hintEffects.circle.destroy();
            if (this.hintEffects.flash) this.hintEffects.flash.destroy();

            // 清空引用
            this.hintEffects = null;
        }
    }

    preload() {
        this.load.setBaseURL('assets/');
        
        // 加载音频资源
        this.load.audio('agriculture-bgm', 'audio/AgricultureScene.mp3');
        this.load.audio('fly', 'audio/fly.mp3');      // 飞行音效
        this.load.audio('action', 'audio/action.mp3'); // 操作音效
        this.load.audio('finish', 'audio/finish.mp3'); // 添加完成音效
        
        // 加载场景基础资源
        this.load.image('agriculture-bg', 'images/scenes/agriculture/background.png');
        this.load.image('airplane', 'images/scenes/agriculture/airplane.png'); 
        
        // 加载通用资源
        this.load.image('back', 'images/common/back.png');                             // 返回按钮
                        // 特效
        
        // 加载奖牌相关资源
        this.load.image('gold-medal', 'images/common/gold.png');
        this.load.image('silver-medal', 'images/common/silver.png');
        this.load.image('bronze-medal', 'images/common/bronze.png');
        this.load.image('try-again-btn', 'images/common/try-again.png');
        this.load.image('other-games-btn', 'images/common/other-games.png');

        // 加载奖励相关资源
        this.load.image('reward-bg', 'images/common/reward-bg.png');
        this.load.image('gold', 'images/common/gold.png');
        this.load.image('silver', 'images/common/silver.png');
        this.load.image('bronze', 'images/common/bronze.png');
    }

    // 添加 resize 方法来处理窗口大小变化
    resize() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 更新背景尺寸
        this.children.list.forEach(child => {
            if (child.texture && child.texture.key === 'agriculture-bg') {
                child.setDisplaySize(width, height);
            }
        });

        // 更新角色位置和大小
        if (this.player) {
            this.player.setPosition(width * 0.15, height * 0.7)
                .setScale(height * 0.001);
        }

        // 更新无人机位置
        if (this.airplane) {
            this.airplane.setPosition(width * 0.5, height * 0.9);
        }

        // 更新农田遮罩
        this.updateFieldMask();
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
        playerManager.updateGameMedal('agriculture', medal);

        // 显示完成消息
        this.showCompletionMessage(medal);
    }

    // 修改 shutdown 方法
    shutdown() {
        if (this.bgm) {
            this.bgm.stop();
            this.bgm.destroy();
            this.bgm = null;
        }
        if (this.flySound) {
            this.flySound.stop();
            this.flySound.destroy();
            this.flySound = null;
        }
        if (this.currentActionSound) {
            this.currentActionSound.stop();
            this.currentActionSound.destroy();
            this.currentActionSound = null;
        }
    }
}
