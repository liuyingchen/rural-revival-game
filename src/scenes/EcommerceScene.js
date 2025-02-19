import { playerManager } from '../managers/PlayerManager.js';

export default class EcommerceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EcommerceScene' });
        this.boxCount = 0;        // 已完成的箱子数
        this.targetBoxCount = 20; // 目标箱子数改为20
        this.gameStartTime = 0;   
        this.isPlaying = false;
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

        // 添加背景图并设置为全屏
        this.add.image(width/2, height/2, 'ecommerce-bg')
            .setDisplaySize(width, height)
            .setDepth(-1);

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

        // 状态文本
        this.timeText = this.add.text(width - 200, 20, 'Time: 0s', {
            fontSize: Math.min(width, height) * 0.03 + 'px',  // 动态字体大小
            fill: '#000',
            backgroundColor: '#ffffff80',
            padding: { x: 15, y: 8 }
        }).setDepth(2);

        this.boxText = this.add.text(width - 200, 70, `Box: ${this.boxCount}/${this.targetBoxCount}`, {
            fontSize: Math.min(width, height) * 0.03 + 'px',  // 动态字体大小
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
            if (this.isPlaying && !this.isPackingAnimating) {
                this.sealAndMoveBox();
                this.playPackingAnimation();
            }
        });

        this.showStartPrompt();
    }

    showStartPrompt() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 创建半透明黑色背景
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.5);
        overlay.fillRect(0, 0, width, height);

        // 创建木质风格的对话框背景
        const dialogBox = this.add.graphics();
        
        // 木质背景色
        const woodColor = 0xE6D5AC;  // 浅木色
        const borderColor = 0x8B4513;  // 深木色边框

        // 添加外边框阴影效果
        dialogBox.fillStyle(borderColor, 0.3);
        dialogBox.fillRoundedRect(
            width/2 - 310, 
            height/2 - 160, 
            620, 
            320, 
            20
        );

        // 主对话框
        dialogBox.lineStyle(4, borderColor);
        dialogBox.fillStyle(woodColor, 0.95);
        dialogBox.fillRoundedRect(
            width/2 - 300, 
            height/2 - 150, 
            600, 
            300, 
            20
        );
        dialogBox.strokeRoundedRect(
            width/2 - 300, 
            height/2 - 150, 
            600, 
            300, 
            20
        );

        // 添加木纹纹理效果
        const woodPattern = this.add.graphics();
        woodPattern.lineStyle(1, borderColor, 0.1);
        for (let i = 0; i < 30; i++) {
            woodPattern.lineBetween(
                width/2 - 300, 
                height/2 - 150 + i * 10, 
                width/2 + 300, 
                height/2 - 150 + i * 10
            );
        }

        // 调整文字内容的位置（由于没有标题，所以往上移）
        const content = this.add.text(width/2, height/2, 
            '欢迎来到农村电商物流中心！\n\n' +
            '点击箱子开始打包工作。\n\n' +
            '准备好了吗？点击任意位置开始！', {
            fontSize: '24px',
            fontFamily: 'Arial, PingFang SC, Microsoft YaHei',
            fill: '#4A3000',
            align: 'center',
            lineSpacing: 10,
            wordWrap: { width: 500 }
        }).setOrigin(0.5);

        // 准备文字内容
        const messages = [
            '欢迎来到乡村电商快递站！',
            '现在，你是一名农村电商从业者，',
            '这里是村里新建的电商服务站。',
            '我们要帮助村民们打包农产品快递，',
            '把新鲜的农产品送到城里的消费者手中。',
            '记住：速度要快，包装要好！',
            '一个箱子可以装10个包裹，',
            '我们今天的任务是完成20个箱子。',
            '',
            '准备好了吗？点击任意位置开始游戏！'
        ];

        let currentText = '';
        let messageIndex = 0;
        let charIndex = 0;
        
        // 文字动画定时器
        const textTimer = this.time.addEvent({
            delay: 40,  // 稍微加快文字显示速度
            callback: () => {
                if (messageIndex < messages.length) {
                    if (charIndex < messages[messageIndex].length) {
                        currentText += messages[messageIndex][charIndex];
                        content.setText(currentText);
                        charIndex++;
                    } else {
                        currentText += '\n';
                        messageIndex++;
                        charIndex = 0;
                        
                        // 每显示完一句话停顿一下
                        if (messageIndex < messages.length) {
                            this.time.delayedCall(300, () => {}, [], this);
                        }
                    }

                    // 保持最多显示4行文字
                    const lines = currentText.split('\n');
                    if (lines.length > 4) {
                        lines.shift();  // 移除第一行
                        currentText = lines.join('\n');
                    }
                    content.setText(currentText);
                } else {
                    textTimer.destroy();
                }
            },
            callbackScope: this,
            loop: true
        });

        // 点击任意位置开始游戏
        this.input.once('pointerdown', () => {
            textTimer.destroy();  // 停止文字动画
            overlay.destroy();
            dialogBox.destroy();
            woodPattern.destroy();
            content.destroy();
            
            // 设置游戏状态和开始时间
            this.isPlaying = true;
            this.gameStartTime = Date.now();
            
            // 开始计时
            this.timer = this.time.addEvent({
                delay: 100,
                callback: this.updateTimer,
                callbackScope: this,
                loop: true
            });
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
                                        sealedBox.destroy();
                                        if (this.boxCount >= this.targetBoxCount) {
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

    showCompletionMessage(medal) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        const completionTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        
        // 更新玩家奖牌状态
        if (!window.gameState.medals.ecommerce || 
            this.getMedalValue(medal) > this.getMedalValue(window.gameState.medals.ecommerce)) {
            window.gameState.medals.ecommerce = medal;
        }

        // 创建黑色背景
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 1);
        overlay.fillRect(0, 0, width, height);

        // 添加弹窗背景，调整为铺满屏幕
        const popupBg = this.add.image(width/2, height/2, 'popup-bg')
            .setDisplaySize(width, height);  // 修改这里，使用屏幕宽高

        // 调整文本位置以适应新的布局
        const titleText = this.add.text(width/2, height/3, 
            'Congratulations!', {
            fontSize: '48px',
            fill: '#4A3000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const timeText = this.add.text(width/2, height/3 + 80,
            `Time: ${completionTime}s`, {
            fontSize: '36px',
            fill: '#4A3000'
        }).setOrigin(0.5);

        // 调整奖牌位置
        const medalImage = this.add.image(width/2, height/2, `${medal}-medal`)
            .setScale(1.2);

        // 调整按钮位置
        const retryButton = this.add.image(width/2 - 120, height * 0.7, 'try-again-btn')
            .setScale(0.8)
            .setInteractive();

        const backButton = this.add.image(width/2 + 120, height * 0.7, 'other-games-btn')
            .setScale(0.8)
            .setInteractive();

        // 添加按钮交互效果
        [retryButton, backButton].forEach(button => {
            button.on('pointerover', () => {
                this.tweens.add({
                    targets: button,
                    scale: 0.9,
                    duration: 100
                });
            });

            button.on('pointerout', () => {
                this.tweens.add({
                    targets: button,
                    scale: 0.8,
                    duration: 100
                });
            });
        });

        retryButton.on('pointerdown', () => {
            this.scene.restart();
        });

        backButton.on('pointerdown', () => {
            this.scene.start('SceneSelectScene');
        });

        // 移除原来的粒子效果代码，改用简单的闪光精灵动画
        const createSparkle = (x, y) => {
            const sparkle = this.add.image(x, y, 'sparkle')
                .setScale(0.3)
                .setAlpha(0.6);

            this.tweens.add({
                targets: sparkle,
                scale: 0,
                alpha: 0,
                duration: 1500,
                onComplete: () => {
                    sparkle.destroy();
                }
            });
        };

        // 创建多个闪光点
        const createSparkles = () => {
            const centerX = width/2;
            const centerY = height/2;
            const radius = 100;

            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;
                createSparkle(x, y);
            }

            // 中心点闪光
            createSparkle(centerX, centerY);
        };

        // 定期创建闪光效果
        this.time.addEvent({
            delay: 2000,
            callback: createSparkles,
            loop: true
        });

        // 立即创建一次闪光效果
        createSparkles();

        // 添加奖牌动画效果
        this.tweens.add({
            targets: medalImage,
            y: medalImage.y - 15,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
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

        // 3. 添加闪光效果
        const flash = this.add.image(
            this.openBox.x,
            this.openBox.y,
            'sparkle'
        ).setScale(0.3).setAlpha(0.6);

        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 0.5,
            duration: 1500,
            repeat: -1,
            ease: 'Cubic.easeOut'
        });

        // 4. 当点击箱子时，移除所有提示动画
        this.openBox.on('pointerdown', () => {
            if (this.isPlaying) {
                // 停止浮动动画
                this.tweens.killTweensOf(this.openBox);
                // 移除提示效果
                circle.destroy();
                flash.destroy();
                // 重置箱子位置
                this.openBox.y = this.conveyor.y - this.conveyor.displayHeight * 0.3;
            }
        });
    }

    // 在 preload 中确保加载所需资源
    preload() {
        this.load.setBaseURL('assets/');
        
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
        this.load.image('popup-bg', 'images/common/popup-bg.png');
        this.load.image('try-again-btn', 'images/common/try-again.png');
        this.load.image('other-games-btn', 'images/common/other-games.png');
        this.load.image('sparkle', 'images/common/sparkle.png');
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
}
