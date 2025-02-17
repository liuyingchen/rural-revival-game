export default class AgricultureScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AgricultureScene' });
        this.airplane = null;
        this.isPlaying = false;
        this.currentRound = 0;  // 当前轮次：0-播种，1-浇水，2-施肥
        this.fieldProgress = 0;  // 用于控制遮罩层的渐变进度
        this.width = 0;   // 添加场景尺寸属性
        this.height = 0;
    }

    create() {
        // 保存场景尺寸
        this.width = this.cameras.main.width;
        this.height = this.cameras.main.height;

        // 添加稻田背景
        this.add.image(this.width/2, this.height/2, 'agriculture-bg')
            .setDisplaySize(this.width, this.height)
            .setDepth(-2);  // 确保背景在最底层

        // 创建稻田遮罩
        this.createField();

        // 添加无人机并放置在底部
        this.airplane = this.add.sprite(this.width * 0.5, this.height * 0.9, 'airplane')
            .setScale(0.3)
            .setDepth(1);  // 确保无人机在最上层

        // 返回按钮
        this.createBackButton();

        // 添加无人机的提示动画
        this.addAirplaneHintEffects();

        // 显示开始提示
        this.showStartPrompt();
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

        // 无人机上下浮动
        this.tweens.add({
            targets: this.airplane,
            y: this.airplane.y - 15,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 点击事件
        this.airplane.setInteractive();
        this.airplane.on('pointerdown', () => {
            if (this.isPlaying) {
                glow.destroy();
                this.startOperation();
            }
        });
    }

    startOperation() {
        this.tweens.killTweensOf(this.airplane);
        this.currentRound = 0;
        
        const points = this.generateContinuousPath();
        let currentIndex = 0;
        let currentTime = 0;
        let lastEffectTime = 0;
        
        const moveToNextPoint = () => {
            if (currentIndex < points.length - 1) {
                const currentPoint = points[currentIndex];
                const nextPoint = points[currentIndex + 1];
                const duration = 750;  // 进一步降低速度
                
                const ease = nextPoint.curve ? 'Sine.easeInOut' : 'Linear';
                
                this.tweens.add({
                    targets: this.airplane,
                    x: nextPoint.x,
                    y: nextPoint.y,
                    duration: duration,
                    ease: ease,
                    onUpdate: (tween) => {
                        const now = Date.now();
                        if (now - lastEffectTime > 30) {  // 提高效果生成频率
                            if (currentTime < 5000) {
                                this.createSeedEffect(this.airplane.x, this.airplane.y + 20);
                            } else if (currentTime < 11000) {
                                this.createWaterEffect(this.airplane.x, this.airplane.y + 20);
                            } else if (currentTime < 16000) {
                                this.createFertilizeEffect(this.airplane.x, this.airplane.y + 20);
                            }
                            lastEffectTime = now;
                        }
                    },
                    onComplete: () => {
                        currentIndex++;
                        currentTime += duration;
                        
                        this.fieldProgress = Math.min(currentTime / 16000, 1);
                        this.updateFieldMask();
                        
                        if (currentTime < 16000) {
                            moveToNextPoint();
                        } else {
                            this.addAirplaneHintEffects();
                        }
                    }
                });
            }
        };

        moveToNextPoint();
    }

    generateContinuousPath() {
        const points = [];
        
        // 起始点
        points.push({
            x: this.width * 0.5,
            y: this.height * 0.9
        });

        // 更大范围的飞行路径
        points.push(
            { x: this.width * 0.2, y: this.height * 0.8, curve: true },
            { x: this.width * 0.1, y: this.height * 0.65 },
            { x: this.width * 0.9, y: this.height * 0.6, curve: true },
            { x: this.width * 0.15, y: this.height * 0.5, curve: true },
            { x: this.width * 0.95, y: this.height * 0.45, curve: true },
            { x: this.width * 0.05, y: this.height * 0.35, curve: true },
            { x: this.width * 0.9, y: this.height * 0.3, curve: true },
            { x: this.width * 0.1, y: this.height * 0.25, curve: true }
        );

        // 返回路径
        points.push(
            { x: this.width * 0.5, y: this.height * 0.3, curve: true },
            { x: this.width * 0.5, y: this.height * 0.9 }
        );

        return points;
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
        // 移除随机概率检查，改为连续生成
        for (let i = 0; i < 4; i++) {  // 增加水滴数量
            const dropSize = Phaser.Math.FloatBetween(1.5, 3);
            const drop = this.add.graphics();
            
            drop.fillStyle(0x4A90E2, 0.7);
            drop.fillCircle(0, 0, dropSize);
            
            // 随机初始位置和速度
            drop.x = x + Phaser.Math.Between(-45, 45);
            drop.y = y;
            
            const vx = Phaser.Math.FloatBetween(-0.3, 0.3);
            let vy = Phaser.Math.FloatBetween(2, 3);  // 随机初始下落速度
            const gravity = 0.25;
            
            const dropUpdate = () => {
                vy += gravity;
                drop.y += vy;
                drop.x += vx;
                
                // 添加拖尾效果
                const trail = this.add.graphics();
                trail.fillStyle(0x4A90E2, 0.3);
                trail.fillCircle(drop.x, drop.y, dropSize * 0.7);
                
                this.tweens.add({
                    targets: trail,
                    alpha: 0,
                    duration: 200,
                    onComplete: () => trail.destroy()
                });
                
                if (drop.y > this.cameras.main.height * 0.65) {
                    this.createWaterSplash(drop.x, drop.y);
                    drop.destroy();
                    this.events.off('update', dropUpdate);
                }
            };
            
            this.events.on('update', dropUpdate);
        }
    }

    createWaterSplash(x, y) {
        const splash = this.add.graphics();
        splash.fillStyle(0x4A90E2, 0.5);
        
        // 创建更大的扩散效果
        const radius = 4;
        splash.fillCircle(x, y, radius);
        
        // 扩散动画
        this.tweens.add({
            targets: splash,
            scaleX: 3,
            scaleY: 0.4,
            alpha: 0,
            duration: 400,
            ease: 'Quad.out',
            onComplete: () => splash.destroy()
        });
    }

    createFertilizeEffect(x, y) {
        if (Math.random() < 0.5) {
            // 增加粒子数量
            for (let i = 0; i < 8; i++) {
                const particle = this.add.graphics();
                particle.fillStyle(0x8B4513, 0.8);
                particle.fillCircle(0, 0, 1.5);
                particle.x = x + Phaser.Math.Between(-10, 10);
                particle.y = y;

                const angle = (Math.PI / 4) * i + Phaser.Math.FloatBetween(-0.3, 0.3);
                const distance = Phaser.Math.FloatBetween(60, 120);

                this.tweens.add({
                    targets: particle,
                    x: particle.x + Math.cos(angle) * distance,
                    y: particle.y + Math.sin(angle) * distance,
                    alpha: 0,
                    duration: 800,
                    ease: 'Quad.out',
                    onComplete: () => particle.destroy()
                });
            }
        }
    }

    createBackButton() {
        const backButton = this.add.container(100, 50);
        const backBg = this.add.image(0, 0, 'button')
            .setDisplaySize(120, 40);
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

    showStartPrompt() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 创建半透明背景
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, width, height);

        // 创建提示框
        const messageBox = this.add.graphics();
        messageBox.fillStyle(0xE6D5AC, 0.95);
        messageBox.lineStyle(4, 0x8B4513);
        messageBox.fillRoundedRect(width/2 - 300, height/2 - 150, 600, 300, 20);
        messageBox.strokeRoundedRect(width/2 - 300, height/2 - 150, 600, 300, 20);

        // 添加提示文本
        const content = this.add.text(width/2, height/2, 
            '欢迎来到现代化农业示范基地！\n\n' +
            '你将操控智能无人机进行农田管理。\n\n' +
            '点击无人机开始自动巡航，\n' +
            '执行播种、浇水、施肥等操作。\n\n' +
            '准备好了吗？点击任意位置开始！', {
            fontSize: '24px',
            fill: '#4A3000',
            align: 'center',
            lineSpacing: 10,
            wordWrap: { width: 500 }
        }).setOrigin(0.5);

        // 点击开始游戏
        this.input.once('pointerdown', () => {
            overlay.destroy();
            messageBox.destroy();
            content.destroy();
            this.isPlaying = true;
        });
    }

    endGame() {
        // 实现游戏结束逻辑
        console.log('游戏结束');
    }
}
