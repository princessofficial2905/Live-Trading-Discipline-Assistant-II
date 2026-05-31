import { useEffect, useMemo, useState } from "react";

const LIVE_LOCK_STORAGE_KEY = "liveTradingSessionLockedUntil";
const LEGACY_LOCK_STORAGE_KEY = "liveTradingCommittedUntil";
const ACTIVE_SIDE_STORAGE_KEY = "liveTradingActiveSide";
const LOCK_DURATION_MS = 5 * 60 * 1000;
const TRADING_SESSION_START_MINUTES = 9 * 60;
const TRADING_SESSION_END_MINUTES = 15 * 60;

const SECTIONS = {
  HOME: "home",
  LIVE: "live",
  AFTER_SESSION: "afterSession",
  CALCULATOR: "calculator",
};

const TRADE_SIDES = {
  BUY: "buy",
  SELL: "sell",
};

const SIDE_LABELS = {
  [TRADE_SIDES.BUY]: "Buy",
  [TRADE_SIDES.SELL]: "Sell",
};

const CALCULATOR_RETURN = {
  HOME: "home",
  LIVE_MANAGEMENT: "liveManagement",
};

const initialCalculatorInputs = {
  entryPrice: "",
  quantity: "",
  target1Profit: "50",
  target2Profit: "100",
  maxRisk: "50",
  checkPrice: "",
};

// Add ordered step images here later. Values can be public paths such as
// `${import.meta.env.BASE_URL}step-images/live-01.png` or hosted image URLs.
const STEP_IMAGE_MAP = {
  "live-01": `${import.meta.env.BASE_URL}step-images/live-01.png`,
  "live-02": `${import.meta.env.BASE_URL}step-images/live-02.png`,
  "live-03": `${import.meta.env.BASE_URL}step-images/live-03.png`,
  "live-04": `${import.meta.env.BASE_URL}step-images/live-04.png`,
  "retry-01": "",
  "buy-01": "",
  "buy-02": "",
  "buy-03": `${import.meta.env.BASE_URL}step-images/buy-03.png`,
  "buy-04": "",
  "buy-05": "",
  "buy-06": `${import.meta.env.BASE_URL}step-images/buy-06.png`,
  "sell-01": "",
  "sell-02": "",
  "sell-03": `${import.meta.env.BASE_URL}step-images/sell-03.png?v=20260531-2`,
  "sell-04": "",
  "sell-05": "",
  "sell-06": `${import.meta.env.BASE_URL}step-images/sell-06.png`,
  "after-session-01": "",
  "after-session-02": "",
  "after-session-03": "",
  "after-session-04": "",
  "after-session-05": "",
  "after-session-06": "",
  "after-session-07": "",
  "after-session-08": `${import.meta.env.BASE_URL}step-images/after-session-08.png`,
  "after-session-09": "",
  "after-session-10": "",
  "after-session-11": "",
  "after-session-12": "",
  "after-session-13": "",
  "after-session-14": "",
  "after-session-15": "",
  "after-session-16": "",
  "after-session-17": "",
  "after-session-18": "",
  "after-session-19": "",
};

const liveSetupSteps = withStepImageKeys(
  [
    { id: "trading-view", title: "Trading View" },
    { id: "timeframe", title: "Timeframe :\n\n2 Minutes" },
    { id: "first-alert", title: "Scroll through watchlist until first alert" },
  ],
  "live",
);

const liveSideChoiceStep = {
  id: "choose-side",
  title: "Choose trade side",
  support: "Use the first alert only. Stay with the sequence.",
  imageKey: "live-04",
};

const retryChoiceStep = {
  id: "fresh-alert-retry",
  title: "Any fresh buy/sell alert?",
  support: "SL hit. One last clean try only.",
  imageKey: "retry-01",
};

const tradeFlowSteps = {
  [TRADE_SIDES.BUY]: withStepImageKeys(
    [
      { id: "buy-zerodha", title: "Zerodha" },
      { id: "buy-enter", title: "Enter: Buy" },
      {
        id: "buy-sl",
        title: "First SL:\n\nStrong Low Of\nTrading View\n\n( T : 2 Min )",
      },
      { id: "buy-target", title: "Target: Calculator", type: "target" },
      { id: "buy-manage", title: "Trade closed?", type: "management" },
      {
        id: "buy-remove-alerts",
        title: "Remove any active ATO / Alerts",
        type: "cleanup",
      },
    ],
    "buy",
  ),
  [TRADE_SIDES.SELL]: withStepImageKeys(
    [
      { id: "sell-zerodha", title: "Zerodha" },
      { id: "sell-enter", title: "Enter: Sell" },
      { id: "sell-sl", title: "First SL:\n\nNearby River" },
      { id: "sell-target", title: "Target: Calculator", type: "target" },
      { id: "sell-manage", title: "Trade closed?", type: "management" },
      {
        id: "sell-remove-alerts",
        title: "Remove any active ATO / Alerts",
        type: "cleanup",
      },
    ],
    "sell",
  ),
};

const afterSessionSteps = [
  { title: "Download today's sent symbols list" },
  {
    title:
      "Attach this PDF file along with the Nifty 500 symbols list PDF in ChatGPT",
  },
  {
    title:
      "Ask ChatGpt :\n\nprovide me with the symbols that are visible in my PDF but are not found in the uploaded Nifty 500 PDF",
  },
  { title: "Delete the existing watchlist in TradingView" },
  {
    title:
      "Double tap each of those symbols one by one, copy them, and paste them into the TradingView watchlist",
  },
  { title: "Set the timeframe to 3 minutes" },
  { title: "Indicator: LuxAlgo Smart Money Concepts" },
  { title: "Keep only those symbols that meet both parameters" },
  { title: "Parameter A :\n\nToday's strong low" },
  { title: "Parameter B :\n\nNo red barriers except the week-low tiny line" },
  { title: "Delete all remaining symbols from the watchlist" },
  { title: "List down the final symbols from the watchlist" },
  { title: "Add all of them to your Zerodha watchlist" },
  { title: "List down their LTPs" },
  { title: "Calculate quantity for each of them" },
  {
    title: "Example:",
    support: "Margin = 10000\n1000 / 2 = 500\n10000 - 500 = 9500",
  },
  { title: "Fill in the quantity values for instant order placements" },
  { title: "All set for next trading session" },
  { title: "After-session steps complete.", final: true },
];

const afterSessionFlowSteps = withStepImageKeys(
  afterSessionSteps,
  "after-session",
);

function withStepImageKeys(steps, prefix) {
  return steps.map((step, index) => ({
    ...step,
    imageKey: step.imageKey ?? `${prefix}-${String(index + 1).padStart(2, "0")}`,
  }));
}

function createCalculatorInputs() {
  return { ...initialCalculatorInputs };
}

function isTradeSide(value) {
  return value === TRADE_SIDES.BUY || value === TRADE_SIDES.SELL;
}

function readLiveLockUntil() {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = Number(
    window.localStorage.getItem(LIVE_LOCK_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_LOCK_STORAGE_KEY),
  );

  if (!Number.isFinite(stored) || stored <= Date.now()) {
    window.localStorage.removeItem(LIVE_LOCK_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_LOCK_STORAGE_KEY);
    return null;
  }

  return stored;
}

function saveLiveLockUntil(timestamp) {
  window.localStorage.setItem(LIVE_LOCK_STORAGE_KEY, String(timestamp));
  window.localStorage.removeItem(LEGACY_LOCK_STORAGE_KEY);
}

function readActiveSide() {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(ACTIVE_SIDE_STORAGE_KEY);

  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored);

    if (parsed && isTradeSide(parsed.side)) {
      return parsed.side;
    }
  } catch {
    if (isTradeSide(stored)) {
      return stored;
    }
  }

  window.localStorage.removeItem(ACTIVE_SIDE_STORAGE_KEY);
  return null;
}

function saveActiveSide(side) {
  window.localStorage.setItem(
    ACTIVE_SIDE_STORAGE_KEY,
    JSON.stringify({
      side,
      updatedAt: Date.now(),
    }),
  );
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function isTradingSessionTime(timestamp) {
  const localDate = new Date(timestamp);
  const minutesSinceMidnight =
    localDate.getHours() * 60 + localDate.getMinutes();

  return (
    minutesSinceMidnight >= TRADING_SESSION_START_MINUTES &&
    minutesSinceMidnight < TRADING_SESSION_END_MINUTES
  );
}

function parseNumber(value) {
  if (String(value).trim() === "") {
    return Number.NaN;
  }

  return Number(value);
}

function formatMoney(value) {
  if (!Number.isFinite(value)) {
    return "--";
  }

  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getCalculatorOutputs(inputs, side) {
  const entryPrice = parseNumber(inputs.entryPrice);
  const quantity = parseNumber(inputs.quantity);
  const target1Profit = parseNumber(inputs.target1Profit);
  const target2Profit = parseNumber(inputs.target2Profit);
  const maxRisk = parseNumber(inputs.maxRisk);
  const checkPrice = parseNumber(inputs.checkPrice);

  if (
    !Number.isFinite(entryPrice) ||
    !Number.isFinite(quantity) ||
    !Number.isFinite(target1Profit) ||
    !Number.isFinite(target2Profit) ||
    !Number.isFinite(maxRisk) ||
    quantity <= 0
  ) {
    return {
      target1Price: Number.NaN,
      target2Price: Number.NaN,
      stopLossPrice: Number.NaN,
      checkPnl: Number.NaN,
    };
  }

  const isSell = side === TRADE_SIDES.SELL;
  const directionMultiplier = isSell ? -1 : 1;
  const checkPnl = Number.isFinite(checkPrice)
    ? (isSell ? entryPrice - checkPrice : checkPrice - entryPrice) * quantity
    : Number.NaN;

  return {
    target1Price: entryPrice + directionMultiplier * (target1Profit / quantity),
    target2Price: entryPrice + directionMultiplier * (target2Profit / quantity),
    stopLossPrice: entryPrice - directionMultiplier * (maxRisk / quantity),
    checkPnl,
  };
}

function App() {
  const [mainSection, setMainSection] = useState(SECTIONS.HOME);
  const [livePhase, setLivePhase] = useState("setup");
  const [liveSetupIndex, setLiveSetupIndex] = useState(0);
  const [liveTradeIndex, setLiveTradeIndex] = useState(0);
  const [liveSide, setLiveSide] = useState(null);
  const [liveAttempt, setLiveAttempt] = useState(1);
  const [afterSessionIndex, setAfterSessionIndex] = useState(0);
  const [activeSide, setActiveSide] = useState(() => readActiveSide());
  const [calculatorSide, setCalculatorSide] = useState(TRADE_SIDES.BUY);
  const [calculatorReturn, setCalculatorReturn] = useState(
    CALCULATOR_RETURN.HOME,
  );
  const [calculatorInputs, setCalculatorInputs] = useState(() => ({
    [TRADE_SIDES.BUY]: createCalculatorInputs(),
    [TRADE_SIDES.SELL]: createCalculatorInputs(),
  }));
  const [liveLockUntil, setLiveLockUntil] = useState(() => readLiveLockUntil());
  const [now, setNow] = useState(() => Date.now());
  const [homeNotice, setHomeNotice] = useState("");

  const tradingSessionOpen = isTradingSessionTime(now);
  const isLiveLocked = Number.isFinite(liveLockUntil) && liveLockUntil > now;
  const liveCountdown = isLiveLocked
    ? formatCountdown(liveLockUntil - now)
    : "00:00";
  const currentCalculatorInputs = calculatorInputs[calculatorSide];
  const calculatorOutputs = useMemo(
    () => getCalculatorOutputs(currentCalculatorInputs, calculatorSide),
    [calculatorSide, currentCalculatorInputs],
  );
  const buyCalculatorLockMessage = getCalculatorLockMessage(
    TRADE_SIDES.BUY,
    activeSide,
    tradingSessionOpen,
  );
  const sellCalculatorLockMessage = getCalculatorLockMessage(
    TRADE_SIDES.SELL,
    activeSide,
    tradingSessionOpen,
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!liveLockUntil || liveLockUntil > now) {
      return;
    }

    window.localStorage.removeItem(LIVE_LOCK_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_LOCK_STORAGE_KEY);
    setLiveLockUntil(null);
  }, [liveLockUntil, now]);

  function resetLiveState() {
    setLivePhase("setup");
    setLiveSetupIndex(0);
    setLiveTradeIndex(0);
    setLiveSide(null);
    setLiveAttempt(1);
  }

  function goHome(options = {}) {
    resetLiveState();
    setAfterSessionIndex(0);
    setMainSection(SECTIONS.HOME);

    if (!options.keepNotice) {
      setHomeNotice("");
    }
  }

  function startLiveFlow() {
    if (isLiveLocked) {
      setHomeNotice(
        "Live Trading Session is locked for 5 minutes. Use the active trade calculator if needed.",
      );
      return;
    }

    resetLiveState();
    setHomeNotice("");
    setMainSection(SECTIONS.LIVE);
  }

  function startAfterSessionFlow() {
    setAfterSessionIndex(0);
    setHomeNotice("");
    setMainSection(SECTIONS.AFTER_SESSION);
  }

  function getCalculatorLockMessageFor(side) {
    return getCalculatorLockMessage(side, activeSide, tradingSessionOpen);
  }

  function openCalculator(side, returnTarget = CALCULATOR_RETURN.HOME) {
    const lockMessage = getCalculatorLockMessageFor(side);

    if (lockMessage) {
      setHomeNotice(lockMessage);

      if (mainSection !== SECTIONS.HOME) {
        return;
      }

      return;
    }

    setCalculatorSide(side);
    setCalculatorReturn(returnTarget);
    setHomeNotice("");
    setMainSection(SECTIONS.CALCULATOR);
  }

  function closeCalculator() {
    if (calculatorReturn === CALCULATOR_RETURN.LIVE_MANAGEMENT && liveSide) {
      setMainSection(SECTIONS.LIVE);
      setLivePhase("trade");
      setLiveTradeIndex(getManagementStepIndex(liveSide));
      return;
    }

    goHome();
  }

  function updateCalculatorInput(side, field, value) {
    setCalculatorInputs((currentInputs) => ({
      ...currentInputs,
      [side]: {
        ...currentInputs[side],
        [field]: value,
      },
    }));
  }

  function selectLiveSide(side) {
    setLiveSide(side);
    setActiveSide(side);
    saveActiveSide(side);
    setLivePhase("trade");
    setLiveTradeIndex(0);
    setLiveAttempt(livePhase === "retry" ? 2 : liveAttempt);
  }

  function nextLiveStep() {
    if (livePhase === "setup") {
      if (liveSetupIndex < liveSetupSteps.length - 1) {
        setLiveSetupIndex((currentIndex) => currentIndex + 1);
        return;
      }

      setLivePhase("choice");
      return;
    }

    if (livePhase !== "trade" || !liveSide) {
      return;
    }

    const currentStep = tradeFlowSteps[liveSide][liveTradeIndex];

    if (currentStep.type === "cleanup") {
      completeLiveFlow();
      return;
    }

    setLiveTradeIndex((currentIndex) => currentIndex + 1);
  }

  function goLiveBack() {
    if (livePhase === "setup") {
      if (liveSetupIndex === 0) {
        goHome();
        return;
      }

      setLiveSetupIndex((currentIndex) => currentIndex - 1);
      return;
    }

    if (livePhase === "choice") {
      setLivePhase("setup");
      setLiveSetupIndex(liveSetupSteps.length - 1);
      return;
    }

    if (livePhase === "retry") {
      if (liveSide) {
        setLivePhase("trade");
        setLiveTradeIndex(getManagementStepIndex(liveSide));
      } else {
        setLivePhase("choice");
      }

      return;
    }

    if (livePhase === "trade") {
      if (liveTradeIndex === 0) {
        setLivePhase(liveAttempt === 1 ? "choice" : "retry");
        return;
      }

      setLiveTradeIndex((currentIndex) => currentIndex - 1);
    }
  }

  function completeLiveFlow() {
    const nextLockUntil = Date.now() + LOCK_DURATION_MS;
    saveLiveLockUntil(nextLockUntil);
    setLiveLockUntil(nextLockUntil);
    setNow(Date.now());
    setHomeNotice(
      "Live Trading Session is locked for 5 minutes. Use the active trade calculator if needed.",
    );

    resetLiveState();
    setMainSection(SECTIONS.HOME);
  }

  function handleTradeClosed(result) {
    if (result === "sl" && liveAttempt === 1) {
      setLivePhase("retry");
      return;
    }

    setLiveTradeIndex(getCleanupStepIndex(liveSide));
  }

  function renderLiveStep() {
    if (livePhase === "setup") {
      const step = liveSetupSteps[liveSetupIndex];
      const progress = `Step ${liveSetupIndex + 1} of ${
        liveSetupSteps.length + 1
      }`;

      return (
        <StepCard
          label="LIVE TRADING SESSION"
          progress={progress}
          title={step.title}
          imageKey={step.imageKey}
          actions={[
            {
              label: "Next",
              onClick: nextLiveStep,
            },
          ]}
        />
      );
    }

    if (livePhase === "choice") {
      return (
        <StepCard
          label="LIVE TRADING SESSION"
          progress={`Step ${liveSetupSteps.length + 1} of ${
            liveSetupSteps.length + 1
          }`}
          title={liveSideChoiceStep.title}
          support={liveSideChoiceStep.support}
          imageKey={liveSideChoiceStep.imageKey}
          actions={[
            {
              label: "Buy",
              onClick: () => selectLiveSide(TRADE_SIDES.BUY),
              variant: "success",
            },
            {
              label: "Sell",
              onClick: () => selectLiveSide(TRADE_SIDES.SELL),
              reminder: "Strong High --> Weak",
              variant: "danger",
            },
          ]}
        />
      );
    }

    if (livePhase === "retry") {
      return (
        <StepCard
          label="SL RETRY"
          progress="Last try"
          title={retryChoiceStep.title}
          support={retryChoiceStep.support}
          imageKey={retryChoiceStep.imageKey}
          actions={[
            {
              label: "Buy",
              onClick: () => selectLiveSide(TRADE_SIDES.BUY),
              variant: "success",
            },
            {
              label: "Sell",
              onClick: () => selectLiveSide(TRADE_SIDES.SELL),
              variant: "danger",
            },
          ]}
        />
      );
    }

    if (!liveSide) {
      return null;
    }

    const steps = tradeFlowSteps[liveSide];
    const step = steps[liveTradeIndex];
    const sideLabel = SIDE_LABELS[liveSide];
    const progress = `Try ${liveAttempt} of 2 - ${sideLabel} ${
      liveTradeIndex + 1
    } of ${steps.length}`;
    const lastTryWarning =
      liveAttempt === 2
        ? "Last try - after this, session will lock for 5 minutes."
        : "";

    if (step.type === "target") {
      return (
        <StepCard
          label={`${sideLabel.toUpperCase()} FLOW`}
          progress={progress}
          title={step.title}
          support={lastTryWarning}
          imageKey={step.imageKey}
          tone={liveSide}
          actions={[
            {
              label: `Open ${sideLabel} Calculator / Set Target`,
              onClick: () =>
                openCalculator(liveSide, CALCULATOR_RETURN.LIVE_MANAGEMENT),
              variant: liveSide === TRADE_SIDES.BUY ? "success" : "danger",
            },
            {
              label: "Continue",
              onClick: nextLiveStep,
              variant: "ghost",
            },
          ]}
        />
      );
    }

    if (step.type === "management") {
      return (
        <StepCard
          label={`${sideLabel.toUpperCase()} FLOW`}
          progress={progress}
          title={step.title}
          support={lastTryWarning}
          imageKey={step.imageKey}
          tone={liveSide}
          actions={[
            {
              label: "SL?",
              onClick: () => handleTradeClosed("sl"),
              variant: "danger",
            },
            {
              label: "Target?",
              onClick: () => handleTradeClosed("target"),
              variant: "success",
            },
            {
              label: `Open ${sideLabel} Calculator`,
              onClick: () =>
                openCalculator(liveSide, CALCULATOR_RETURN.LIVE_MANAGEMENT),
              variant: liveSide === TRADE_SIDES.BUY ? "success" : "danger",
            },
          ]}
        />
      );
    }

    return (
      <StepCard
        label={`${sideLabel.toUpperCase()} FLOW`}
        progress={progress}
        title={step.title}
        imageKey={step.imageKey}
        tone={liveSide}
        actions={[
          {
            label: step.type === "cleanup" ? "Complete Session" : "Next",
            onClick: nextLiveStep,
            variant: step.type === "cleanup" ? "success" : "accent",
          },
        ]}
      />
    );
  }

  return (
    <main className="app-shell">
      <div className="phone-frame">
        {mainSection === SECTIONS.HOME && (
          <HomePage
            activeSide={activeSide}
            buyCalculatorLocked={Boolean(buyCalculatorLockMessage)}
            countdown={liveCountdown}
            homeNotice={homeNotice}
            isLiveLocked={isLiveLocked}
            onAfterSession={startAfterSessionFlow}
            onBuyCalculator={() => openCalculator(TRADE_SIDES.BUY)}
            onLive={startLiveFlow}
            onSellCalculator={() => openCalculator(TRADE_SIDES.SELL)}
            sellCalculatorLocked={Boolean(sellCalculatorLockMessage)}
            tradingSessionOpen={tradingSessionOpen}
          />
        )}

        {mainSection === SECTIONS.LIVE && (
          <FlowShell
            onBack={goLiveBack}
            onHome={goHome}
            statusText={
              liveSide ? `Active side: ${SIDE_LABELS[liveSide]}` : "One step"
            }
          >
            {renderLiveStep()}
          </FlowShell>
        )}

        {mainSection === SECTIONS.AFTER_SESSION && (
          <LinearFlow
            label="AFTER SESSION RITUAL"
            steps={afterSessionFlowSteps}
            index={afterSessionIndex}
            setIndex={setAfterSessionIndex}
            finalButtonLabel="Back to Home"
            onHome={goHome}
          />
        )}

        {mainSection === SECTIONS.CALCULATOR && (
          <CalculatorPage
            side={calculatorSide}
            inputs={currentCalculatorInputs}
            outputs={calculatorOutputs}
            onChange={(field, value) =>
              updateCalculatorInput(calculatorSide, field, value)
            }
            onDone={closeCalculator}
            onHome={goHome}
          />
        )}
      </div>
    </main>
  );
}

function getCalculatorLockMessage(side, activeSide, tradingSessionOpen) {
  if (!tradingSessionOpen || !activeSide || activeSide === side) {
    return "";
  }

  return `${SIDE_LABELS[side]} Calculator is locked because your active session is ${SIDE_LABELS[activeSide]}.`;
}

function getManagementStepIndex(side) {
  return tradeFlowSteps[side].findIndex((step) => step.type === "management");
}

function getCleanupStepIndex(side) {
  return tradeFlowSteps[side].findIndex((step) => step.type === "cleanup");
}

function HomePage({
  activeSide,
  buyCalculatorLocked,
  countdown,
  homeNotice,
  isLiveLocked,
  onAfterSession,
  onBuyCalculator,
  onLive,
  onSellCalculator,
  sellCalculatorLocked,
  tradingSessionOpen,
}) {
  return (
    <section className="home-screen" aria-label="Home">
      <div className="home-hero home-title-card">
        <DecorativeShapes variant="home" />
        <h1>Enter : Target : Enjoy</h1>
      </div>

      <div className="status-strip" aria-live="polite">
        <span>
          {isLiveLocked
            ? "Session locked"
            : tradingSessionOpen
              ? "Trading window active"
              : "Free mode"}
        </span>
        <strong>
          {activeSide
            ? `Active side: ${SIDE_LABELS[activeSide]}`
            : "No active side"}
        </strong>
      </div>

      {(homeNotice || isLiveLocked) && (
        <LockMessage
          message={
            homeNotice ||
            "Live Trading Session is locked for 5 minutes. Use the active trade calculator if needed."
          }
          detail={isLiveLocked ? `Available again in ${countdown}` : ""}
        />
      )}

      <div className="home-actions" aria-label="Main sections">
        <HomeSectionButton
          className="trading-card"
          description={
            isLiveLocked
              ? `Locked now. Available again in ${countdown}.`
              : "Begin the live Buy/Sell discipline sequence."
          }
          locked={isLiveLocked}
          marker="01"
          onClick={onLive}
          title="Live Trading Session"
        />

        <HomeSectionButton
          className="after-card"
          description="Run the exact after-session preparation ritual."
          marker="02"
          onClick={onAfterSession}
          title="After Session Ritual"
        />

        <HomeSectionButton
          className="buy-card"
          description={
            buyCalculatorLocked
              ? "Locked because your active session is Sell."
              : "Calculate Buy targets, risk, and P&L."
          }
          locked={buyCalculatorLocked}
          marker="03"
          onClick={onBuyCalculator}
          title="Buy Calculator"
        />

        <HomeSectionButton
          className="sell-card"
          description={
            sellCalculatorLocked
              ? "Locked because your active session is Buy."
              : "Calculate Sell targets, risk, and P&L."
          }
          locked={sellCalculatorLocked}
          marker="04"
          onClick={onSellCalculator}
          title="Sell Calculator"
        />
      </div>
    </section>
  );
}

function HomeSectionButton({
  className = "",
  title,
  description,
  marker,
  onClick,
  locked = false,
}) {
  return (
    <button
      className={`section-card ${className} ${locked ? "is-locked" : ""}`}
      type="button"
      onClick={onClick}
    >
      <DecorativeShapes variant="card" />
      <span className="section-marker">{marker}</span>
      <span className="section-title">{title}</span>
      <small>{description}</small>
    </button>
  );
}

function FlowShell({ children, onBack, onHome, statusText }) {
  return (
    <section className="flow-shell">
      <header className="flow-nav" aria-label="Flow navigation">
        <AppButton label="Back" onClick={onBack} variant="nav" />
        <span>{statusText}</span>
        <AppButton label="Home" onClick={onHome} variant="nav" />
      </header>

      {children}
    </section>
  );
}

function LinearFlow({
  label,
  steps,
  index,
  setIndex,
  onHome,
  finalButtonLabel,
}) {
  const step = steps[index];
  const isFinal = Boolean(step.final);
  const progress = `Step ${index + 1} of ${steps.length}`;

  function goBack() {
    if (index === 0) {
      onHome();
      return;
    }

    setIndex(index - 1);
  }

  return (
    <section className="flow-shell">
      <header className="flow-nav" aria-label="Flow navigation">
        <AppButton label="Back" onClick={goBack} variant="nav" />
        <span>Review ritual</span>
        <AppButton label="Home" onClick={onHome} variant="nav" />
      </header>

      <StepCard
        title={step.title}
        support={step.support}
        label={label}
        progress={progress}
        imageKey={step.imageKey}
        actions={[
          {
            label: isFinal ? finalButtonLabel : "Next",
            onClick: isFinal ? onHome : () => setIndex(index + 1),
          },
        ]}
      />
    </section>
  );
}

function CalculatorPage({ side, inputs, outputs, onChange, onDone, onHome }) {
  return (
    <section className="flow-shell">
      <header className="flow-nav" aria-label="Calculator navigation">
        <AppButton label="Done" onClick={onDone} variant="nav" />
        <span>{SIDE_LABELS[side]} Calculator</span>
        <AppButton label="Home" onClick={onHome} variant="nav" />
      </header>

      <CalculatorCard
        side={side}
        inputs={inputs}
        outputs={outputs}
        onChange={onChange}
        onDone={onDone}
      />
    </section>
  );
}

function StepCard({
  label,
  progress = "",
  title,
  support = "",
  imageKey,
  tone = "default",
  actions,
}) {
  return (
    <article className={`step-card tone-${tone}`}>
      <DecorativeShapes variant={`step-${tone}`} />
      <div className="step-card-body">
        <ScreenHeader label={label} progress={progress} />
        <StepImage imageKey={imageKey} title={title} />
        <div className="step-copy">
          <h1 data-testid="screen-title">{title}</h1>
          <SupportBlock support={support} />
        </div>
      </div>

      <div className="action-stack">
        {actions.map((action) => (
          <AppButton
            key={action.label}
            label={action.label}
            onClick={action.onClick}
            reminder={action.reminder}
            variant={action.variant}
          />
        ))}
      </div>
    </article>
  );
}

function ScreenHeader({ label, progress }) {
  return (
    <div className="screen-header">
      <span className="screen-label">{label}</span>
      {progress && <span className="progress-pill">{progress}</span>}
    </div>
  );
}

function StepImage({ imageKey, title }) {
  const imageSrc = imageKey ? STEP_IMAGE_MAP[imageKey] : "";

  if (imageSrc) {
    return (
      <figure className="step-image">
        <img src={imageSrc} alt={`${title} reference`} />
      </figure>
    );
  }

  return (
    <figure className="step-image step-image-placeholder">
      <DecorativeShapes variant="image" />
      <div className="placeholder-bars" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <figcaption>
        <strong>Image slot</strong>
        <span>{imageKey}</span>
      </figcaption>
    </figure>
  );
}

function SupportBlock({ support }) {
  if (!support) {
    return null;
  }

  const lines = support
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return (
      <div className="support-list" data-testid="screen-support">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    );
  }

  return <p data-testid="screen-support">{support}</p>;
}

function CalculatorCard({ side, inputs, outputs, onChange, onDone }) {
  const pnlIsValid = Number.isFinite(outputs.checkPnl);
  const pnlIsProfit = pnlIsValid && outputs.checkPnl >= 0;
  const pnlLabel = pnlIsValid
    ? `${pnlIsProfit ? "Profit" : "Loss"} ${formatMoney(Math.abs(outputs.checkPnl))}`
    : "--";

  return (
    <article className={`calculator-card tone-${side}`}>
      <DecorativeShapes variant={`calculator-${side}`} />
      <div className="calculator-intro">
        <ScreenHeader label="CALCULATOR" progress={SIDE_LABELS[side]} />
        <h1>{SIDE_LABELS[side]} Calculator</h1>
        <p>
          Enter price, quantity, target profit, and risk. The calculator keeps
          the direction logic separate for Buy and Sell.
        </p>
      </div>

      <div className="input-grid">
        <NumberInput
          label="Entry Price"
          value={inputs.entryPrice}
          onChange={(value) => onChange("entryPrice", value)}
        />
        <NumberInput
          label="Quantity"
          value={inputs.quantity}
          onChange={(value) => onChange("quantity", value)}
        />
        <NumberInput
          label="Target 1 Profit Amount"
          value={inputs.target1Profit}
          onChange={(value) => onChange("target1Profit", value)}
        />
        <NumberInput
          label="Target 2 Profit Amount"
          value={inputs.target2Profit}
          onChange={(value) => onChange("target2Profit", value)}
        />
        <NumberInput
          label="Max Risk Amount"
          value={inputs.maxRisk}
          onChange={(value) => onChange("maxRisk", value)}
        />
        <NumberInput
          label="Check Price"
          value={inputs.checkPrice}
          onChange={(value) => onChange("checkPrice", value)}
        />
      </div>

      <div className="output-grid" aria-live="polite">
        <OutputCard
          label="Target 1 Price"
          value={formatMoney(outputs.target1Price)}
        />
        <OutputCard
          label="Target 2 Price"
          value={formatMoney(outputs.target2Price)}
        />
        <OutputCard
          danger
          label="Stop Loss Price"
          value={formatMoney(outputs.stopLossPrice)}
        />
        <OutputCard
          danger={pnlIsValid && !pnlIsProfit}
          label="Estimated P&L at Check Price"
          success={pnlIsValid && pnlIsProfit}
          value={pnlLabel}
        />
      </div>

      <AppButton label="Done" onClick={onDone} variant="accent" />
    </article>
  );
}

function NumberInput({ label, value, onChange }) {
  return (
    <label className="number-field">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function OutputCard({ label, value, danger = false, success = false }) {
  return (
    <div
      className={`output-card ${danger ? "output-danger" : ""} ${
        success ? "output-success" : ""
      }`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AppButton({ label, onClick, reminder = "", variant = "accent" }) {
  return (
    <button
      className={`app-button button-${variant} ${reminder ? "has-reminder" : ""}`}
      type="button"
      onClick={onClick}
    >
      <span>{label}</span>
      {reminder && <small className="button-reminder">{reminder}</small>}
    </button>
  );
}

function DecorativeShapes({ variant = "default" }) {
  return (
    <div className={`decor-shapes decor-${variant}`} aria-hidden="true">
      <span className="decor-shape shape-ring" />
      <span className="decor-shape shape-quarter" />
      <span className="decor-shape shape-triangle" />
      <span className="decor-shape shape-dots" />
      <span className="decor-shape shape-pill" />
    </div>
  );
}

function LockMessage({ message, detail = "" }) {
  return (
    <section className="lock-message" aria-live="polite">
      <strong>{message}</strong>
      {detail && <span>{detail}</span>}
    </section>
  );
}

export default App;
