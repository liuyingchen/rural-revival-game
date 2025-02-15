export default class EcommerceScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EcommerceScene' });
        this.packageCount = 0;    // 当前箱子的包裹数
        this.boxesCompleted = 0;  // 完成的箱子数
        this.gameStartTime = 0;   // 游戏开始时间
        this.isPlaying = false;
        this.packages = [];  // 存储所有包裹
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 添加背景
        this.add.image(width/2, height/2, 'ecommerce-bg')
            .setDisplaySize(width, height);

        // 添加静态传送带
        this.conveyor = this.add.image(
            width * 0.65,    // 水平位置改为0.5，放在中间偏右位置
            height * 0.75,   // 垂直位置改为0.7，与角色同高
            'conveyor'
        ).setScale(0.5);    // 放大一点以适应蓝色框的大小

        // 添加选择的角色
        const characterType = window.gameState.character || 'female';
        this.player = this.add.sprite(
            width * 0.25,
            height * 0.7,
            characterType
        ).setScale(0.8);

        // 添加打开状态的包裹（初始包裹）
        this.openPackage = this.add.image(
            this.conveyor.x - this.conveyor.width * 0.3,  // 调整包裹位置，放在传送带左侧
            this.conveyor.y - 20,  // 稍微抬高一点
            'package-open'
        ).setScale(0.5)
            .setInteractive();

        // 点击事件处理
        this.openPackage.on('pointerdown', () => {
            if (this.isPlaying) {
                this.addNewPackage();
                this.playPackageAnimation();
            }
        });

        // 添加键盘控制
        this.cursors = this.input.keyboard.createCursorKeys();

        // 创建状态文本（右侧）
        this.timeText = this.add.text(width - 150, 50, '用时: 0秒', {
            fontSize: '24px',
            fill: '#000',
            backgroundColor: '#ffffff80',
            padding: { x: 10, y: 5 }
        });

        this.boxText = this.add.text(width - 150, 90, `箱数: ${this.boxesCompleted}/5`, {
            fontSize: '24px',
            fill: '#000',
            backgroundColor: '#ffffff80',
            padding: { x: 10, y: 5 }
        });

        this.packageText = this.add.text(width - 150, 130, `包裹: ${this.packageCount}/10`, {
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
        const content = this.add.text(width/2, height/2, '', {
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
            '我们今天的任务是完成5个箱子。',
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
        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        this.timeText.setText(`用时: ${elapsed}秒`);
    }

    addNewPackage() {
        const newPackage = this.add.image(
            this.openPackage.x,  // 从打开包裹的位置开始
            this.openPackage.y,
            'package-closed'  // 需要新的关闭状态包裹图片
        ).setScale(0.5);

        // 添加移动动画
        this.tweens.add({
            targets: newPackage,
            x: this.conveyor.x + this.conveyor.width * 0.4,  // 移动到传送带右侧
            duration: 1500,
            ease: 'Linear',
            onComplete: () => {
                // 完成时销毁包裹
                newPackage.destroy();
                // 更新计数
                this.packageCount++;
                this.packageText.setText(`包裹: ${this.packageCount}/10`);

                if (this.packageCount >= 10) {
                    this.boxesCompleted++;
                    this.boxText.setText(`箱数: ${this.boxesCompleted}/5`);
                    this.packageCount = 0;
                    this.packageText.setText(`包裹: ${this.packageCount}/10`);

                    if (this.boxesCompleted >= 5) {
                        this.endGame();
                    }
                }
            }
        });
    }

    showBoxCompletedMessage() {
        // 创建提示背景
        const messageBox = this.add.graphics();
        messageBox.fillStyle(0x000000, 0.7);
        messageBox.fillRect(200, 250, 400, 100);

        // 创建提示文本
        const message = this.add.text(400, 300, 
            `第 ${this.boxesCompleted} 个箱子打包完成！\n继续打包下一个箱子...`, {
            fontSize: '24px',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        // 2秒后自动消失
        this.time.delayedCall(2000, () => {
            messageBox.destroy();
            message.destroy();
        });
    }

    endGame() {
        this.isPlaying = false;
        this.timer.destroy();

        const elapsed = Math.floor((Date.now() - this.gameStartTime) / 1000);
        let reward = '';
        let medalColor = '';
        
        if (elapsed <= 60) {
            reward = '金牌';
            medalColor = '#FFD700';  // 金色
        } else if (elapsed <= 90) {
            reward = '银牌';
            medalColor = '#C0C0C0';  // 银色
        } else {
            reward = '铜牌';
            medalColor = '#CD7F32';  // 铜色
        }

        // 创建半透明背景
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, 800, 600);

        // 创建结果对话框
        const dialogBox = this.add.graphics();
        dialogBox.fillStyle(0xFFFFFF, 1);
        dialogBox.fillRoundedRect(200, 100, 400, 400, 20);
        dialogBox.lineStyle(4, 0x4A90E2);
        dialogBox.strokeRoundedRect(200, 100, 400, 400, 20);

        // 添加奖牌图标
        const medal = this.add.image(400, 250, 'medal')
            .setScale(1.5)
            .setTint(parseInt(medalColor.replace('#', '0x')));

        // 添加奖牌光效
        const glow = this.add.graphics();
        glow.lineStyle(20, parseInt(medalColor.replace('#', '0x')), 0.3);
        glow.strokeCircle(400, 250, 50);

        // 添加闪烁动画
        this.tweens.add({
            targets: glow,
            alpha: 0,
            duration: 1000,
            yoyo: true,
            repeat: -1
        });

        // 添加结果文本
        const resultText = this.add.text(400, 350, [
            `用时: ${elapsed} 秒`,
            `完成箱数: 5`,
            `总包裹数: 50`,
            `获得 ${reward}！`,
            '',
            '点击任意位置关闭'
        ].join('\n'), {
            fontSize: '24px',
            fill: '#333333',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        // 添加评价文本
        let comment = '';
        if (elapsed <= 60) {
            comment = '太棒了！你是快递打包专家！';
        } else if (elapsed <= 90) {
            comment = '非常好！继续加油！';
        } else {
            comment = '已经很不错了，还可以更快哦！';
        }
        
        const commentText = this.add.text(400, 480, comment, {
            fontSize: '20px',
            fill: '#666666',
            align: 'center'
        }).setOrigin(0.5);

        // 点击关闭结果对话框，但保持在当前场景
        this.input.once('pointerdown', () => {
            window.gameState.medals.ecommerce = true;
            overlay.destroy();
            dialogBox.destroy();
            medal.destroy();
            glow.destroy();
            resultText.destroy();
            commentText.destroy();
        });

        // 添加奖牌获得动画
        medal.setScale(0);
        this.tweens.add({
            targets: medal,
            scale: 1.5,
            duration: 1000,
            ease: 'Bounce.Out'
        });
    }

    // 修改角色打包动画
    playPackageAnimation() {
        const originalScale = this.player.scaleX;
        
        this.tweens.add({
            targets: this.player,
            scaleX: originalScale * 1.2,
            scaleY: originalScale * 0.8,
            duration: 200,
            yoyo: true,
            ease: 'Power1',
            onComplete: () => {
                this.player.setScale(originalScale);
            }
        });
    }

    // 添加更新方法
    update() {
        if (this.isPlaying) {
            // 只保留角色移动逻辑
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
}
