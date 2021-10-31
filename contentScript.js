// こたえ
const ANSWERS = {
  // ベーシックドリル：A1　１年　算数
  TC66713555: [46, 100, 120, 72, 85, 8, 15, 90, 84, 59, 99, 7, 2, 6, 50, 80, 71, 6, 9, 8]
};

const sleep = sec => new Promise(resolve => setTimeout(resolve, sec * 1000));

const embedScript = (script, attributes) => {
  const scriptElement = document.createElement('script');
  for (const [name, value] of Object.entries(attributes || {})) {
    scriptElement.setAttribute(name, value);
  }
  scriptElement.textContent = `(async () => { ${script} })();`;
  document.querySelector('head').appendChild(scriptElement);
};

let messageContainer = null;

const showMessage = (message) => {
  if (messageContainer === null) {
    messageContainer = document.createElement('div');
    messageContainer.style.position = 'absolute';
    messageContainer.style.top = '10px';
    messageContainer.style.left = '10px';
    messageContainer.style.padding = '1em';
    messageContainer.style.fontSize = '200%';
    messageContainer.style.backgroundColor = '#fcc';
    messageContainer.style.zIndex = 10000;
    document.querySelector('body').appendChild(messageContainer);
  }

  const p = document.createElement('p');
  p.textContent = message;
  messageContainer.appendChild(p);
};

const getModuleId = async () => {
  embedScript(`
    if (typeof cmnDrillData === 'undefined') return;
    if (!(cmnDrillData && cmnDrillData[0] && cmnDrillData[0].moduleId)) return;
    const moduleId = cmnDrillData[0].moduleId;
    document.querySelector('#moduleId').setAttribute('data-moduleId', moduleId);
  `, { id: 'moduleId' });
  await sleep(0.5);
  return document.querySelector('#moduleId').getAttribute('data-moduleId');
};

const inputAnswer = (answers) => {
  embedScript(`
    const answers = ${JSON.stringify(answers)};
    const sleep = sec => new Promise(resolve => setTimeout(resolve, sec * 1000));

    // こたえのかずだけ、くりかえす
    for (const [index, answer] of answers.entries()) {
      // 1びょう まつ
      await sleep(1);

      // こたえをにゅうりょくする
      keypadInput(String(answer));

      // 0.4びょう まつ
      await sleep(0.4);

      // 「こたえあわせ」のボタンをおす
      answerSort(index);

      // 0.4びょう まつ
      await sleep(0.4);

      // 「つぎへ」のボタンをおす
      nextQuestion(index, index + 1);
    }
  `);
}

const loadCount = async () => new Promise(resolve => {
  chrome.storage.local.get('count', (items) => {
    resolve(Number.isInteger(items.count) ? items.count : 0);
  });
});

const saveCount = async (count) => new Promise(resolve => {
  chrome.storage.local.set({ count }, resolve);
});

const processDrill = async () => {
  const moduleId = await getModuleId();
  if (!(moduleId in ANSWERS)) return;

  let count = await loadCount();
  if (count <= 0) {
    while (true) {
      const input = prompt('なんかい やりますか？');
      // キャンセル
      if (input === null) return;
      // 入力があった場合
      if (/^[1-9]\d{0,1}$/.test(input)) {
        count = Number(input);
        break;
      }
      alert('1 ～ 999 で していして ください');
    }
  }

  await saveCount(count - 1);
  showMessage(`あと${count}かい やります`);
  inputAnswer(ANSWERS[moduleId]);
};

const processResult = async () => {
  const count = await loadCount();
  if (count <= 0) return;

  await sleep(1);
  document.querySelector('#again_btn').click()
};

const processResultIframe = async () => {
  await sleep(1);
  document.querySelector('.bonus_close').click();
};

switch (location.pathname) {
  // 問題ページ
  case '/seed/vw050004/drill':
  // 結果からの問題ページ
  case '/seed/vw050010/drillStart/':
    processDrill();
    break;

  // 結果ページ
  case '/seed/vw050011/':
    processResult();
    break;

  // 結果ページの iframe
  case '/seed/studentResultBonusGrade/':
    processResultIframe();
    break;
}
