let video; // 儲存影像捕捉物件
let handPose; // 儲存 ml5.handPose 模型
let hands = []; // 儲存手部偵測結果的陣列
let options = {
  flipped: true // 將影像水平翻轉，以便鏡像顯示
};

let items = []; // 儲存所有掉落的蘋果、香蕉、橘子和炸彈的陣列
let itemSize = 20; // 單個物品的繪製大小

let lastItemDropTime = 0; // 上次掉落普通物品的時間
let itemDropInterval = 500; // 普通物品掉落的間隔（毫秒），每0.5秒檢查一次

let lastBombDropTime = 0; // 上次掉落炸彈的時間
let bombDropInterval = 5000; // 炸彈掉落的間隔（毫秒），約 5 秒

// --- 籃子變數 ---
let baskets = []; // 儲存所有籃子的陣列
let basketWidth = itemSize * 3; // 籃子的寬度
let basketHeight = itemSize * 1.5; // 籃子的高度
let basketSpeed = 3; // 籃子移動的速度
let caughtScore = 0; // 接到的物品總分數

// --- 新增教育科技文字相關變數 ---
let showEduTechText = false; // 控制是否顯示「教育科技」文字
let eduTechTextAlpha = 0; // 控制文字的透明度，從 0 (完全透明) 到 255 (完全不透明)
let eduTechTextDisplayTime = 2000; // 文字完全顯示的時間（毫秒），設定為 2 秒
let eduTechTextFadeSpeed = 5; // 文字淡出的速度，值越大淡出越快

// --- 新增教育科技文字擺動與變色相關變數 ---
let eduTechTextOffsetX = 0; // 控制文字左右擺動的偏移量
let eduTechTextAngle = 0; // 控制文字擺動的模擬角度
let eduTechTextMoveSpeed = 0.05; // 控制文字擺動的速度
let colorPhase = 0; // 控制顏色變化的階段 (0: 藍色, 1: 綠色, 2: 紅色)


function preload() {
  // 在 setup 之前載入 ml5.js 的 handPose 模型
  handPose = ml5.handPose(options);
}

function setup() {
  createCanvas(640, 480); // 建立一個 640x480 像素的畫布
  // 創建影像捕捉物件，並設定水平翻轉
  video = createCapture(VIDEO, {
    flipped: true
  });
  video.size(640, 480); // 設定影像尺寸
  video.hide(); // 隱藏網頁上預設的影像元素

  // 啟動手部偵測，當偵測到手部時呼叫 gotHands 函數
  handPose.detectStart(video, gotHands);

  // 初始化四個籃子的位置、大小和移動方向
  baskets.push({
    x: width / 5 - basketWidth / 2, // 畫布寬度的 1/5 處
    y: height - basketHeight - 10, // 畫布底部上方一點
    dir: 1 // 向右移動
  });
  baskets.push({
    x: width / 5 * 2 - basketWidth / 2, // 畫布寬度的 2/5 處
    y: height - basketHeight - 10,
    dir: -1 // 向左移動
  });
  baskets.push({
    x: width / 5 * 3 - basketWidth / 2, // 畫布寬度的 3/5 處
    y: height - basketHeight - 10,
    dir: 1 // 向右移動
  });
  baskets.push({
    x: width / 5 * 4 - basketWidth / 2, // 畫布寬度的 4/5 處
    y: height - basketHeight - 10,
    dir: -1 // 向左移動
  });
}

function draw() {
  background(0); // 設定背景為黑色
  image(video, 0, 0, width, height); // 在畫布上顯示視訊影像

  // 更新並顯示所有掉落的物品
  for (let i = items.length - 1; i >= 0; i--) { // 從後往前遍歷，以便安全刪除元素
    let item = items[i];
    item.y += item.speed; // 物品向下移動

    // 檢查物品是否與任何籃子碰撞
    let caught = false;
    for (let b of baskets) {
      // 判斷物品是否與籃子發生重疊
      if (item.x + itemSize / 2 > b.x &&
        item.x - itemSize / 2 < b.x + basketWidth &&
        item.y + itemSize / 2 > b.y &&
        item.y + itemSize / 2 < b.y + basketHeight) {

        // 根據物品類型增加或重置分數
        if (item.type === 'apple') {
          caughtScore += 1;
        } else if (item.type === 'banana') {
          caughtScore += 2;
        } else if (item.type === 'orange') {
          caughtScore += 3;
        } else if (item.type === 'bomb') {
          caughtScore = 0; // 碰到炸彈分數歸零
        }
        caught = true; // 物品被接住
        break; // 物品被接住，停止檢查其他籃子
      }
    }

    // 如果物品被接住或超出畫面，則移除該物品
    if (caught || item.y > height + itemSize) {
      items.splice(i, 1); // 從陣列中移除物品
    } else {
      drawItem(item); // 否則繪製物品
    }
  }

  // 更新籃子位置，使其左右移動
  for (let b of baskets) {
    b.x += b.dir * basketSpeed; // 根據方向移動籃子
    // 碰到畫布邊界時改變移動方向
    if (b.x < 0 || b.x + basketWidth > width) {
      b.dir *= -1;
    }
  }
  drawBaskets(); // 繪製所有籃子

  // 顯示當前分數
  fill(255); // 白色文字
  textSize(24);
  textAlign(RIGHT, TOP); // 文字右對齊，頂部對齊
  text('水果: ' + caughtScore, width - 20, 20); // 在畫布右上角顯示分數

  ---

  ### **教育科技文字顯示、擺動與變色邏輯**

  // 檢查是否達到 8 個水果並且文字尚未顯示
  if (caughtScore >= 8 && !showEduTechText) {
    showEduTechText = true; // 設定為顯示文字
    eduTechTextAlpha = 255; // 將透明度設定為完全不透明
    eduTechTextAngle = 0; // 重置擺動角度，確保每次出現從中心開始擺動

    // 根據分數範圍設定顏色階段
    if (caughtScore >= 8 && caughtScore < 16) {
      colorPhase = 0; // 藍色
    } else if (caughtScore >= 16 && caughtScore < 24) {
      colorPhase = 1; // 綠色
    } else if (caughtScore >= 24) {
      colorPhase = 2; // 紅色
    }

    // 使用 setTimeout 在 `eduTechTextDisplayTime` 毫秒後執行淡出動畫
    setTimeout(() => {
      // 使用 setInterval 逐步減少文字透明度，實現淡出效果
      let fadeOutInterval = setInterval(() => {
        eduTechTextAlpha -= eduTechTextFadeSpeed; // 根據淡出速度減少透明度
        if (eduTechTextAlpha <= 0) { // 如果透明度小於或等於 0
          eduTechTextAlpha = 0; // 確保透明度不為負值
          showEduTechText = false; // 設定為不顯示文字
          clearInterval(fadeOutInterval); // 清除淡出定時器
        }
      }, 30); // 每 30 毫秒更新一次透明度
    }, eduTechTextDisplayTime); // 顯示一定時間後開始淡出
  }

  // 如果 `showEduTechText` 為 true，則繪製「教育科技」文字
  if (showEduTechText) {
    // 計算左右擺動偏移量
    eduTechTextAngle += eduTechTextMoveSpeed; // 增加角度
    eduTechTextOffsetX = sin(eduTechTextAngle) * 50; // 使用 sin 函數產生左右擺動，幅度為 50 像素

    let textColor;
    // 根據 colorPhase 設定文字顏色
    if (colorPhase === 0) {
      textColor = color(66, 133, 244, eduTechTextAlpha); // 教育科技藍色
    } else if (colorPhase === 1) {
      textColor = color(34, 139, 34, eduTechTextAlpha); // 森林綠
    } else if (colorPhase === 2) {
      textColor = color(255, 69, 0, eduTechTextAlpha); // 橘紅色 (代表更高分數)
    } else {
      textColor = color(255, 255, 255, eduTechTextAlpha); // 預設白色 (以防萬一)
    }

    fill(textColor); // 設定文字顏色
    textSize(48); // 設定文字大小
    textAlign(CENTER, CENTER); // 文字水平和垂直居中對齊
    // 在畫布中央偏上的位置加上擺動偏移量顯示文字
    text('教育科技', width / 2 + eduTechTextOffsetX, height / 2 - 100);
  }

  ---

  // 根據手部位置和時間掉落新物品
  if (hands.length > 0) { // 如果偵測到手部
    let indexFinger = hands[0].keypoints[8]; // 取得第一隻手的食指尖端座標
    handleItemDrops(indexFinger.x, indexFinger.y); // 呼叫物品掉落處理函數
  }
}

// 處理物品掉落的邏輯
function handleItemDrops(fingerX, fingerY) {
  // 掉落一個普通物品（蘋果、香蕉、橘子）
  if (millis() - lastItemDropTime > itemDropInterval) {
    let itemType = random(['apple', 'banana', 'orange']); // 隨機選擇物品類型
    let newItem;

    // 讓蘋果、香蕉、橘子從手部位置附近掉落
    newItem = {
      x: fingerX + random(-itemSize, itemSize), // 在手指附近隨機生成 X 座標
      y: fingerY, // 從手指的 Y 座標開始掉落
      speed: random(1, 3), // 物品掉落的速度
      type: itemType // 物品類型
    };
    items.push(newItem); // 將新物品加入陣列
    lastItemDropTime = millis(); // 更新上次掉落普通物品的時間
  }

  // 掉落一個炸彈
  if (millis() - lastBombDropTime > bombDropInterval) {
    let bombX = random(itemSize, width - itemSize); // 炸彈從隨機的 X 座標掉落
    let newBomb = {
      x: bombX,
      y: -itemSize, // 從畫布上方掉落 (初始在畫布外)
      speed: random(2, 4), // 炸彈可以掉落得快一點
      type: 'bomb' // 物品類型為炸彈
    };
    items.push(newBomb); // 將新炸彈加入陣列
    lastBombDropTime = millis(); // 更新上次掉落炸彈的時間
    bombDropInterval = random(5000, 6000); // 設定下一個炸彈的掉落間隔為 5-6 秒的隨機值
  }
}

// 根據物品類型繪製物品
function drawItem(item) {
  if (item.type === 'apple') {
    drawApple(item.x, item.y);
  } else if (item.type === 'banana') {
    drawBanana(item.x, item.y);
  } else if (item.type === 'orange') {
    drawOrange(item.x, item.y);
  } else if (item.type === 'bomb') {
    drawBomb(item.x, item.y);
  }
}

// 繪製蘋果
function drawApple(x, y) {
  noStroke(); // 不繪製邊框
  fill(255, 0, 0); // 紅色
  ellipse(x, y, itemSize, itemSize); // 畫圓形代表蘋果
  // 畫一個小方塊作為蘋果蒂
  fill(139, 69, 19); // 棕色
  rectMode(CENTER); // 設定矩形繪製模式為中心點
  rect(x, y - itemSize * 0.3, itemSize * 0.2, itemSize * 0.4); // 繪製蒂
}

// 繪製籃子
function drawBaskets() {
  for (let b of baskets) {
    // 繪製籃子主體
    fill(139, 69, 19); // 棕色
    rectMode(CORNER); // 設定矩形繪製模式為左上角
    rect(b.x, b.y, basketWidth, basketHeight - 10, 5); // 繪製帶圓角的矩形作為籃子主體

    // 籃子編織紋理
    stroke(101, 51, 0, 150); // 深棕色，半透明
    strokeWeight(1); // 邊框粗細
    for (let i = 0; i < basketWidth; i += 5) {
      line(b.x + i, b.y, b.x + i, b.y + basketHeight - 10); // 垂直線
    }
    for (let j = 0; j < basketHeight - 10; j += 5) {
      line(b.x, b.y + j, b.x + basketWidth, b.y + j); // 水平線
    }

    // 籃子邊緣線條
    noFill(); // 不填充
    stroke(101, 51, 0); // 深棕色邊框
    strokeWeight(2); // 邊框粗細
    line(b.x, b.y + basketHeight - 10, b.x + basketWidth, b.y + basketHeight - 10);
    line(b.x, b.y + 5, b.x, b.y + basketHeight - 10);
    line(b.x + basketWidth, b.y + 5, b.x + basketWidth, b.y + basketHeight - 10);

    // 籃子提把
    noFill(); // 不填充
    stroke(101, 51, 0); // 深棕色
    strokeWeight(3); // 邊框粗細
    arc(b.x + basketWidth / 2, b.y + 5, basketWidth * 0.8, basketHeight * 0.8, PI, TWO_PI); // 繪製圓弧作為提把
  }
}

// 繪製香蕉
function drawBanana(x, y) {
  noStroke(); // 不繪製邊框
  fill(255, 255, 0); // 黃色
  push(); // 儲存當前繪圖設定
  translate(x, y); // 將原點移動到香蕉位置
  rotate(PI / 6); // 稍微旋轉，模擬彎曲
  rectMode(CENTER); // 設定矩形繪製模式為中心點
  rect(0, 0, itemSize * 1.5, itemSize * 0.5, 5); // 繪製圓角矩形

  // 香蕉頭尾
  fill(0); // 黑色
  ellipse(-itemSize * 0.75, 0, itemSize * 0.2, itemSize * 0.2);
  ellipse(itemSize * 0.75, 0, itemSize * 0.2, itemSize * 0.2);
  pop(); // 恢復之前的繪圖設定
}

// 繪製橘子
function drawOrange(x, y) {
  noStroke(); // 不繪製邊框
  fill(255, 165, 0); // 橘色
  ellipse(x, y, itemSize * 1.1, itemSize * 1.1); // 繪製比蘋果大一點的圓形
  // 畫橘子的小莖
  fill(0, 100, 0); // 深綠色
  rect(x - itemSize * 0.1, y - itemSize * 0.5, itemSize * 0.1, itemSize * 0.2);
  // 畫葉子
  ellipse(x + itemSize * 0.1, y - itemSize * 0.4, itemSize * 0.3, itemSize * 0.1);
}

// 繪製炸彈
function drawBomb(x, y) {
  noStroke(); // 不繪製邊框
  fill(30); // 深灰色或黑色
  ellipse(x, y, itemSize * 1.2, itemSize * 1.2); // 繪製比水果大一點的圓形作為炸彈主體

  // 炸彈引信
  stroke(150, 75, 0); // 棕色
  strokeWeight(2); // 邊框粗細
  line(x, y - itemSize * 0.6, x + itemSize * 0.2, y - itemSize * 0.8);

  // 引信尖端 (火花)
  fill(255, 165, 0); // 橘色
  ellipse(x + itemSize * 0.2, y - itemSize * 0.8, itemSize * 0.2, itemSize * 0.2);

  // 炸彈上的小亮點 (反光)
  fill(100); // 淺灰色
  ellipse(x - itemSize * 0.3, y - itemSize * 0.3, itemSize * 0.3, itemSize * 0.3);
}

// 當 ml5.handPose 模型偵測到手部時，這個函數會被呼叫
function gotHands(results) {
  hands = results; // 將偵測到的手部資訊儲存到 hands 變數中
}
