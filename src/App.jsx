import { useEffect, useMemo, useState } from "react";

const LOCK_STORAGE_KEY = "liveTradingCommittedUntil";
const LOCK_DURATION_MS = 5 * 60 * 1000;

const SECTIONS = {
  HOME: "home",
  LIVE: "live",
  AFTER_SESSION: "afterSession",
  ALERTS: "alerts",
};

const TRADE_DIRECTIONS = {
  LONG: "long",
  SHORT: "short",
};

const LIVE_STEPS = {
  TRADING_VIEW: "tradingView",
  TIMEFRAME: "timeframe",
  LIVE_INDICATORS: "liveIndicators",
  STOCK_SCREENER: "stockScreener",
  BULLISH_SCREENER: "bullishScreener",
  BULLISH_SELECT_SYMBOL: "bullishSelectSymbol",
  BULLISH_SYMBOL_VISIBLE: "bullishSymbolVisible",
  LONG_TRADINGVIEW_CHANDELIER_BUY: "longTradingViewChandelierBuy",
  LONG_ZERODHA_ENTER: "longZerodhaEnter",
  LONG_ENTERING: "longEntering",
  LONG_SL: "longSl",
  LONG_TARGET: "longTarget",
  LONG_CALCULATOR: "longCalculator",
  LONG_RESULT_DECISION: "longResultDecision",
  LONG_SL_RESULT: "longSlResult",
  LONG_TARGET_RESULT: "longTargetResult",
  BEARISH_INTRO: "bearishIntro",
  BEARISH_SCREENER: "bearishScreener",
  BEARISH_SELECT_SYMBOL: "bearishSelectSymbol",
  BEARISH_RESULT_VISIBLE: "bearishResultVisible",
  BEARISH_BACK_TO_BULLISH: "bearishBackToBullish",
  SHORT_SELL_VISIBLE: "shortSellVisible",
  SHORT_STRONG_HIGH: "shortStrongHigh",
  SHORT_ZERODHA_ENTER: "shortZerodhaEnter",
  SHORT_ENTERING: "shortEntering",
  SHORT_SL: "shortSl",
  SHORT_TARGET: "shortTarget",
  SHORT_CALCULATOR: "shortCalculator",
  SHORT_RESULT_DECISION: "shortResultDecision",
  SHORT_SL_RESULT: "shortSlResult",
  SHORT_TARGET_RESULT: "shortTargetResult",
};

const terminalLiveSteps = new Set([
  LIVE_STEPS.LONG_SL_RESULT,
  LIVE_STEPS.LONG_TARGET_RESULT,
  LIVE_STEPS.SHORT_SL_RESULT,
  LIVE_STEPS.SHORT_TARGET_RESULT,
]);

const initialCalculatorInputs = {
  entryPrice: "",
  quantity: "",
  target1Profit: "50",
  target2Profit: "100",
  maxRisk: "50",
  checkPrice: "",
};

const afterSessionSteps = [
  { title: "Download today's sent symbols list" },
  {
    title:
      "Attach this PDF file along with the Nifty 500 symbols list PDF in ChatGPT",
  },
  {
    title:
      "Ask ChatGPT: provide me with the symbols that are visible in my PDF but are not found in the uploaded Nifty 500 PDF",
  },
  { title: "Delete the existing watchlist in TradingView" },
  {
    title:
      "Double tap each of those symbols one by one, copy them, and paste them into the TradingView watchlist",
  },
  { title: "Set the timeframe to 3 minutes" },
  { title: "Indicator: LuxAlgo Smart Money Concepts" },
  { title: "Keep only those symbols that meet both parameters" },
  { title: "Parameter A: Today's strong low" },
  { title: "Parameter B: No red barriers except the week-low tiny line" },
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

const alertsSteps = [
  { title: "Nifty Total Market indice" },
  { title: "Alert - I" },
  { title: "Condition: LuxAlgo" },
  { title: "Bullish BOS" },
  { title: "Interval: 1 min" },
  { title: "Trigger: Once Per Minute" },
  { title: "Expiration: 1 week" },
  { title: "Message: BUY! BUY! BUY!" },
  { title: "Notifications: Toasts + Sound" },
  { title: "Alert - II" },
  { title: "Condition: LuxAlgo" },
  { title: "Bearish BOS" },
  { title: "Interval: 1 min" },
  { title: "Trigger: Once Per Minute" },
  { title: "Expiration: 1 week" },
  { title: "Message: SELL! SELL! SELL!" },
  { title: "Notifications: Toasts + Sound" },
  { title: "TradingView alerts setup complete.", final: true },
];

const bullishFilterGuideSteps = [
  { title: "Bullish Screener", support: "Green" },
  { title: "India / NSE" },
  { title: "Watchlist: Watchlist" },
  { title: "Price Change %" },
  { title: "Interval: 1 day" },
  { title: "Between: 0% to 1.2%" },
  { title: "Relative Volume at Time" },
  { title: "Above (>) 1" },
  { title: "Moving Average Rating" },
  { title: "Interval: 1 day" },
  { title: "Buy" },
  { title: "Strong Buy" },
  { title: "Gap %" },
  { title: "Interval: 1 day" },
  { title: "Between: -0.8% to 0.8%" },
  { title: "Relative Volume at Time in columns" },
  { title: "Sorted by descending" },
  { title: "Bullish filter guide complete.", final: true },
];

const bearishFilterGuideSteps = [
  { title: "Bearish Screener", support: "Red" },
  { title: "India / NSE" },
  { title: "Watchlist: Watchlist" },
  { title: "Price Change %" },
  { title: "Interval: 1 day" },
  { title: "Between: -1.2% to 0%" },
  { title: "Relative Volume at Time" },
  { title: "Above (>) 1" },
  { title: "Moving Average Rating" },
  { title: "Interval: 1 day" },
  { title: "Sell" },
  { title: "Strong Sell" },
  { title: "Momentum" },
  { title: "Below 0" },
  { title: "Length: 10" },
  { title: "Interval: 5 minutes" },
  { title: "Gap %" },
  { title: "Interval: 1 day" },
  { title: "Between: -0.8% to 0.8%" },
  { title: "Relative Volume at Time in columns" },
  { title: "Sorted by descending" },
  { title: "Bearish filter guide complete.", final: true },
];

function readCommittedUntil() {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = Number(window.localStorage.getItem(LOCK_STORAGE_KEY));

  if (!Number.isFinite(stored) || stored <= Date.now()) {
    window.localStorage.removeItem(LOCK_STORAGE_KEY);
    return null;
  }

  return stored;
}

function formatCountdown(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${minutes}:${seconds}`;
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

function isAtOrAfter930(timestamp) {
  const localDate = new Date(timestamp);
  const minutesSinceMidnight =
    localDate.getHours() * 60 + localDate.getMinutes();

  return minutesSinceMidnight >= 9 * 60 + 30;
}

function getCalculatorOutputs(inputs, direction) {
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

  const isShort = direction === TRADE_DIRECTIONS.SHORT;
  const directionMultiplier = isShort ? -1 : 1;
  const checkPnl = Number.isFinite(checkPrice)
    ? (isShort ? entryPrice - checkPrice : checkPrice - entryPrice) * quantity
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
  const [liveStep, setLiveStep] = useState(LIVE_STEPS.TRADING_VIEW);
  const [liveHistory, setLiveHistory] = useState([]);
  const [activeFilterGuide, setActiveFilterGuide] = useState(null);
  const [filterGuideIndex, setFilterGuideIndex] = useState(0);
  const [afterSessionIndex, setAfterSessionIndex] = useState(0);
  const [alertsIndex, setAlertsIndex] = useState(0);
  const [tradeDirection, setTradeDirection] = useState(null);
  const [calculatorInputs, setCalculatorInputs] = useState(
    initialCalculatorInputs,
  );
  const [committedUntil, setCommittedUntil] = useState(() =>
    readCommittedUntil(),
  );
  const [now, setNow] = useState(() => Date.now());

  const isCommittedActive =
    Number.isFinite(committedUntil) && committedUntil > now;
  const committedCountdown = isCommittedActive
    ? formatCountdown(committedUntil - now)
    : "00:00";
  const notVisibleUnlocked = isAtOrAfter930(now);
  const isTerminalLiveStep = terminalLiveSteps.has(liveStep);
  const calculatorOutputs = useMemo(
    () => getCalculatorOutputs(calculatorInputs, tradeDirection),
    [calculatorInputs, tradeDirection],
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!committedUntil || committedUntil > now) {
      return;
    }

    window.localStorage.removeItem(LOCK_STORAGE_KEY);
    setCommittedUntil(null);
  }, [committedUntil, now]);

  function resetLiveState() {
    setLiveStep(LIVE_STEPS.TRADING_VIEW);
    setLiveHistory([]);
    setActiveFilterGuide(null);
    setFilterGuideIndex(0);
    setTradeDirection(null);
    setCalculatorInputs(initialCalculatorInputs);
  }

  function goHome() {
    resetLiveState();
    setAfterSessionIndex(0);
    setAlertsIndex(0);
    setMainSection(SECTIONS.HOME);
  }

  function startLiveFlow() {
    if (isCommittedActive) {
      return;
    }

    resetLiveState();
    setMainSection(SECTIONS.LIVE);
  }

  function startAfterSessionFlow() {
    setAfterSessionIndex(0);
    setMainSection(SECTIONS.AFTER_SESSION);
  }

  function startAlertsFlow() {
    setAlertsIndex(0);
    setMainSection(SECTIONS.ALERTS);
  }

  function navigateLive(nextStep, options = {}) {
    if (options.direction) {
      setTradeDirection(options.direction);
    }

    if (options.startCommitted) {
      const nextCommittedUntil = Date.now() + LOCK_DURATION_MS;
      window.localStorage.setItem(LOCK_STORAGE_KEY, String(nextCommittedUntil));
      setCommittedUntil(nextCommittedUntil);
      setNow(Date.now());
    }

    setLiveHistory((currentHistory) => [...currentHistory, liveStep]);
    setLiveStep(nextStep);
  }

  function replaceLive(nextStep) {
    setLiveStep(nextStep);
  }

  function goLiveBack() {
    if (liveHistory.length === 0) {
      goHome();
      return;
    }

    const previousStep = liveHistory[liveHistory.length - 1];
    setLiveHistory((currentHistory) => currentHistory.slice(0, -1));
    setLiveStep(previousStep);
  }

  function openFilterGuide(type) {
    setActiveFilterGuide(type);
    setFilterGuideIndex(0);
  }

  function closeFilterGuide() {
    setActiveFilterGuide(null);
    setFilterGuideIndex(0);
  }

  function updateCalculatorInput(field, value) {
    setCalculatorInputs((currentInputs) => ({
      ...currentInputs,
      [field]: value,
    }));
  }

  function renderLiveStep() {
    switch (liveStep) {
      case LIVE_STEPS.TRADING_VIEW:
        return (
          <StepScreen
            title="TradingView"
            onNext={() => navigateLive(LIVE_STEPS.TIMEFRAME)}
          />
        );
      case LIVE_STEPS.TIMEFRAME:
        return (
          <StepScreen
            title="Timeframe = 2 minutes"
            onNext={() => navigateLive(LIVE_STEPS.LIVE_INDICATORS)}
          />
        );
      case LIVE_STEPS.LIVE_INDICATORS:
        return (
          <StepScreen
            title="Indicators:"
            support={
              "i. LuxAlgo: Smart Money Concept\nii. Chandelier Exit\niii. LuxAlgo: Trailing Stop"
            }
            onNext={() => navigateLive(LIVE_STEPS.STOCK_SCREENER)}
          />
        );
      case LIVE_STEPS.STOCK_SCREENER:
        return (
          <StepScreen
            title="Open Stock Screener"
            onNext={() => navigateLive(LIVE_STEPS.BULLISH_SCREENER)}
          />
        );
      case LIVE_STEPS.BULLISH_SCREENER:
        return (
          <DecisionScreen
            title="Bullish Screener"
            support="Green"
            options={[
              {
                label: "Filters Guide (Bullish)",
                onClick: () => openFilterGuide("bullish"),
                variant: "secondary",
              },
              {
                label: "Done",
                onClick: () =>
                  navigateLive(LIVE_STEPS.BULLISH_SELECT_SYMBOL),
                variant: "success",
              },
            ]}
          />
        );
      case LIVE_STEPS.BULLISH_SELECT_SYMBOL:
        return (
          <StepScreen
            title="Select symbol on the top of the list"
            onNext={() => navigateLive(LIVE_STEPS.BULLISH_SYMBOL_VISIBLE)}
          />
        );
      case LIVE_STEPS.BULLISH_SYMBOL_VISIBLE:
        return (
          <DecisionScreen
            title="Symbol visible?"
            options={[
              {
                label: "Visible",
                onClick: () =>
                  navigateLive(LIVE_STEPS.LONG_TRADINGVIEW_CHANDELIER_BUY, {
                    direction: TRADE_DIRECTIONS.LONG,
                    startCommitted: true,
                  }),
                variant: "success",
              },
              {
                label: "Not visible",
                onClick: () => navigateLive(LIVE_STEPS.BEARISH_INTRO),
                disabled: !notVisibleUnlocked,
                helper: !notVisibleUnlocked
                  ? "Not visible option unlocks after 9:30"
                  : "",
                variant: "danger",
              },
            ]}
          />
        );
      case LIVE_STEPS.LONG_TRADINGVIEW_CHANDELIER_BUY:
        return (
          <StepScreen
            title="TradingView:"
            support="Chandelier Exit: Buy"
            tone="long"
            onNext={() => navigateLive(LIVE_STEPS.LONG_ZERODHA_ENTER)}
          />
        );
      case LIVE_STEPS.LONG_ZERODHA_ENTER:
        return (
          <StepScreen
            title="Zerodha: Enter"
            tone="long"
            onNext={() => navigateLive(LIVE_STEPS.LONG_ENTERING)}
          />
        );
      case LIVE_STEPS.LONG_ENTERING:
        return (
          <StepScreen
            title="I am entering"
            actionLabel="I am entering"
            tone="long"
            onNext={() => navigateLive(LIVE_STEPS.LONG_SL)}
          />
        );
      case LIVE_STEPS.LONG_SL:
        return (
          <StepScreen
            title="SL: LuxAlgo Trailing Stop"
            tone="long"
            onNext={() => navigateLive(LIVE_STEPS.LONG_TARGET)}
          />
        );
      case LIVE_STEPS.LONG_TARGET:
        return (
          <StepScreen
            title="Target: Calculator"
            actionLabel="Open Calculator"
            tone="long"
            onNext={() => navigateLive(LIVE_STEPS.LONG_CALCULATOR)}
          />
        );
      case LIVE_STEPS.LONG_CALCULATOR:
        return (
          <CalculatorScreen
            direction={TRADE_DIRECTIONS.LONG}
            inputs={calculatorInputs}
            outputs={calculatorOutputs}
            onChange={updateCalculatorInput}
            onNext={() => navigateLive(LIVE_STEPS.LONG_RESULT_DECISION)}
          />
        );
      case LIVE_STEPS.LONG_RESULT_DECISION:
        return (
          <DecisionScreen
            title="What happened?"
            options={[
              {
                label: "SL?",
                onClick: () => navigateLive(LIVE_STEPS.LONG_SL_RESULT),
                variant: "danger",
              },
              {
                label: "Target?",
                onClick: () => navigateLive(LIVE_STEPS.LONG_TARGET_RESULT),
                variant: "success",
              },
            ]}
          />
        );
      case LIVE_STEPS.LONG_SL_RESULT:
        return <ResultScreen message="Koi ni, you did your best." onHome={goHome} />;
      case LIVE_STEPS.LONG_TARGET_RESULT:
        return <ResultScreen message="Congratulations, gurl." onHome={goHome} />;
      case LIVE_STEPS.BEARISH_INTRO:
        return (
          <StepScreen
            title="If no symbol visible in bullish screener, try bearish screener"
            tone="short"
            onNext={() => navigateLive(LIVE_STEPS.BEARISH_SCREENER)}
          />
        );
      case LIVE_STEPS.BEARISH_SCREENER:
        return (
          <DecisionScreen
            title="Bearish Screener"
            support="Red"
            tone="short"
            options={[
              {
                label: "Filters Guide (Bearish)",
                onClick: () => openFilterGuide("bearish"),
                variant: "secondary",
              },
              {
                label: "Done",
                onClick: () =>
                  navigateLive(LIVE_STEPS.BEARISH_SELECT_SYMBOL),
                variant: "danger",
              },
            ]}
          />
        );
      case LIVE_STEPS.BEARISH_SELECT_SYMBOL:
        return (
          <StepScreen
            title="Select symbol on the top of the list"
            tone="short"
            onNext={() => navigateLive(LIVE_STEPS.BEARISH_RESULT_VISIBLE)}
          />
        );
      case LIVE_STEPS.BEARISH_RESULT_VISIBLE:
        return (
          <DecisionScreen
            title="Bearish result visible?"
            tone="short"
            options={[
              {
                label: "Visible",
                onClick: () => navigateLive(LIVE_STEPS.SHORT_SELL_VISIBLE),
                variant: "success",
              },
              {
                label: "Not visible",
                onClick: () =>
                  navigateLive(LIVE_STEPS.BEARISH_BACK_TO_BULLISH),
                variant: "secondary",
              },
            ]}
          />
        );
      case LIVE_STEPS.BEARISH_BACK_TO_BULLISH:
        return (
          <StepScreen
            title="Go back to Bullish Screener"
            actionLabel="Back to Bullish Screener"
            onNext={() => replaceLive(LIVE_STEPS.BULLISH_SCREENER)}
          />
        );
      case LIVE_STEPS.SHORT_SELL_VISIBLE:
        return (
          <StepScreen
            title="Chandelier Exit: Sell visible"
            actionLabel="Sell visible"
            tone="short"
            onNext={() =>
              navigateLive(LIVE_STEPS.SHORT_STRONG_HIGH, {
                direction: TRADE_DIRECTIONS.SHORT,
                startCommitted: true,
              })
            }
          />
        );
      case LIVE_STEPS.SHORT_STRONG_HIGH:
        return (
          <StepScreen
            title="Today's strong high visible"
            actionLabel="Visible"
            tone="short"
            onNext={() => navigateLive(LIVE_STEPS.SHORT_ZERODHA_ENTER)}
          />
        );
      case LIVE_STEPS.SHORT_ZERODHA_ENTER:
        return (
          <StepScreen
            title="Zerodha: Enter"
            support="Sell"
            tone="short"
            onNext={() => navigateLive(LIVE_STEPS.SHORT_ENTERING)}
          />
        );
      case LIVE_STEPS.SHORT_ENTERING:
        return (
          <StepScreen
            title="I am entering"
            actionLabel="I am entering"
            tone="short"
            onNext={() => navigateLive(LIVE_STEPS.SHORT_SL)}
          />
        );
      case LIVE_STEPS.SHORT_SL:
        return (
          <StepScreen
            title="SL: LuxAlgo Trailing Stop"
            tone="short"
            onNext={() => navigateLive(LIVE_STEPS.SHORT_TARGET)}
          />
        );
      case LIVE_STEPS.SHORT_TARGET:
        return (
          <StepScreen
            title="Target: Calculator"
            actionLabel="Open Calculator"
            tone="short"
            onNext={() => navigateLive(LIVE_STEPS.SHORT_CALCULATOR)}
          />
        );
      case LIVE_STEPS.SHORT_CALCULATOR:
        return (
          <CalculatorScreen
            direction={TRADE_DIRECTIONS.SHORT}
            inputs={calculatorInputs}
            outputs={calculatorOutputs}
            onChange={updateCalculatorInput}
            onNext={() => navigateLive(LIVE_STEPS.SHORT_RESULT_DECISION)}
          />
        );
      case LIVE_STEPS.SHORT_RESULT_DECISION:
        return (
          <DecisionScreen
            title="What happened?"
            options={[
              {
                label: "SL?",
                onClick: () => navigateLive(LIVE_STEPS.SHORT_SL_RESULT),
                variant: "danger",
              },
              {
                label: "Target?",
                onClick: () => navigateLive(LIVE_STEPS.SHORT_TARGET_RESULT),
                variant: "success",
              },
            ]}
          />
        );
      case LIVE_STEPS.SHORT_SL_RESULT:
        return <ResultScreen message="Koi ni, you gave your best." onHome={goHome} />;
      case LIVE_STEPS.SHORT_TARGET_RESULT:
        return <ResultScreen message="Congratulations, gurl." onHome={goHome} />;
      default:
        return null;
    }
  }

  return (
    <main className="app-shell">
      <div className="phone-frame">
        {mainSection === SECTIONS.HOME && (
          <HomePage
            isCommittedActive={isCommittedActive}
            countdown={committedCountdown}
            onLive={startLiveFlow}
            onAfterSession={startAfterSessionFlow}
            onAlerts={startAlertsFlow}
          />
        )}

        {mainSection === SECTIONS.LIVE && (
          <LiveFlowShell
            isCommittedActive={isCommittedActive}
            countdown={committedCountdown}
            showNav={
              !activeFilterGuide && !isCommittedActive && !isTerminalLiveStep
            }
            onBack={goLiveBack}
            onHome={goHome}
          >
            {activeFilterGuide ? (
              <FilterGuideFlow
                type={activeFilterGuide}
                steps={
                  activeFilterGuide === "bullish"
                    ? bullishFilterGuideSteps
                    : bearishFilterGuideSteps
                }
                index={filterGuideIndex}
                setIndex={setFilterGuideIndex}
                onBackToScreener={closeFilterGuide}
                onHome={goHome}
              />
            ) : (
              renderLiveStep()
            )}
          </LiveFlowShell>
        )}

        {mainSection === SECTIONS.AFTER_SESSION && (
          <LinearFlow
            steps={afterSessionSteps}
            index={afterSessionIndex}
            setIndex={setAfterSessionIndex}
            finalButtonLabel="Back to Home"
            onHome={goHome}
          />
        )}

        {mainSection === SECTIONS.ALERTS && (
          <LinearFlow
            steps={alertsSteps}
            index={alertsIndex}
            setIndex={setAlertsIndex}
            finalButtonLabel="Back to Home"
            onHome={goHome}
          />
        )}
      </div>
    </main>
  );
}

function HomePage({
  isCommittedActive,
  countdown,
  onLive,
  onAfterSession,
  onAlerts,
}) {
  return (
    <section className="home-screen" aria-label="Home">
      <div className="home-copy">
        <p className="app-kicker">Live Trading Discipline Assistant II</p>
        <h1>Reminder: Fuck The Idea of Brokerage Donation.</h1>
      </div>

      <div className="home-actions" aria-label="Main sections">
        <button
          className={`section-card trading-card ${
            isCommittedActive ? "section-card-locked" : ""
          }`}
          type="button"
          onClick={onLive}
          disabled={isCommittedActive}
        >
          <span>Live Trading Session Steps</span>
          {isCommittedActive && (
            <small>Available again in: {countdown}</small>
          )}
        </button>

        <button
          className="section-card after-card"
          type="button"
          onClick={onAfterSession}
        >
          <span>After-Session</span>
        </button>

        <button className="section-card alerts-card" type="button" onClick={onAlerts}>
          <span>TradingView Alerts Steps</span>
        </button>
      </div>

      {isCommittedActive && <LockedCommittedScreen countdown={countdown} />}
    </section>
  );
}

function LockedCommittedScreen({ countdown }) {
  return (
    <section className="lock-panel" aria-live="polite">
      <h2>Live trading flow committed.</h2>
      <p>Available again in: {countdown}</p>
    </section>
  );
}

function LiveFlowShell({
  isCommittedActive,
  countdown,
  showNav,
  onBack,
  onHome,
  children,
}) {
  return (
    <section className="flow-shell">
      {showNav && (
        <header className="flow-nav" aria-label="Live flow navigation">
          <button className="nav-button" type="button" onClick={onBack}>
            Back
          </button>
          <button className="nav-button" type="button" onClick={onHome}>
            Home
          </button>
        </header>
      )}

      {isCommittedActive && (
        <p className="commit-chip" aria-live="polite">
          Committed flow active: {countdown}
        </p>
      )}

      {children}
    </section>
  );
}

function StepScreen({
  title,
  support = "",
  actionLabel = "Next",
  tone = "default",
  onNext,
}) {
  return (
    <article className={`step-screen tone-${tone}`}>
      <div className="step-copy">
        <h1 data-testid="screen-title">{title}</h1>
        {support && <p data-testid="screen-support">{support}</p>}
      </div>
      <button className="primary-action" type="button" onClick={onNext}>
        {actionLabel}
      </button>
    </article>
  );
}

function DecisionScreen({ title, support = "", options, tone = "default" }) {
  return (
    <article className={`step-screen decision-screen tone-${tone}`}>
      <div className="step-copy">
        <h1 data-testid="screen-title">{title}</h1>
        {support && <p data-testid="screen-support">{support}</p>}
      </div>
      <div className="decision-actions">
        {options.map((option) => (
          <div className="decision-option" key={option.label}>
            <button
              className={`primary-action action-${option.variant ?? "primary"}`}
              type="button"
              onClick={option.onClick}
              disabled={option.disabled}
            >
              {option.label}
            </button>
            {option.helper && <small>{option.helper}</small>}
          </div>
        ))}
      </div>
    </article>
  );
}

function CalculatorScreen({ direction, inputs, outputs, onChange, onNext }) {
  const isShort = direction === TRADE_DIRECTIONS.SHORT;
  const pnlIsValid = Number.isFinite(outputs.checkPnl);
  const pnlIsProfit = pnlIsValid && outputs.checkPnl >= 0;
  const pnlLabel = pnlIsValid
    ? `${pnlIsProfit ? "Profit" : "Loss"} ${formatMoney(outputs.checkPnl)}`
    : "--";

  return (
    <article className={`calculator-screen tone-${direction}`}>
      <div className="calculator-copy">
        <p className="calculator-mode">
          Calculator Mode: {isShort ? "SELL / SHORT" : "BUY / LONG"}
        </p>

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
            label="Check price"
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
            label="Stop Loss Price"
            value={formatMoney(outputs.stopLossPrice)}
            danger
          />
          <OutputCard
            label="Estimated P&L at check price"
            value={pnlLabel}
            danger={pnlIsValid && !pnlIsProfit}
            success={pnlIsValid && pnlIsProfit}
          />
        </div>
      </div>

      <button className="primary-action" type="button" onClick={onNext}>
        Next
      </button>
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

function ResultScreen({ message, onHome }) {
  return (
    <article className="step-screen result-screen">
      <div className="step-copy">
        <h1 data-testid="screen-title">{message}</h1>
      </div>
      <button className="primary-action" type="button" onClick={onHome}>
        Back to Home
      </button>
    </article>
  );
}

function LinearFlow({ steps, index, setIndex, onHome, finalButtonLabel }) {
  const step = steps[index];
  const isFinal = Boolean(step.final);

  function goBack() {
    if (index === 0) {
      onHome();
      return;
    }

    setIndex(index - 1);
  }

  return (
    <section className="linear-shell">
      <header className="flow-nav" aria-label="Flow navigation">
        <button className="nav-button" type="button" onClick={goBack}>
          Back
        </button>
        <button className="nav-button" type="button" onClick={onHome}>
          Home
        </button>
      </header>

      <StepScreen
        title={step.title}
        support={step.support}
        actionLabel={isFinal ? finalButtonLabel : "Next"}
        onNext={isFinal ? onHome : () => setIndex(index + 1)}
      />
    </section>
  );
}

function FilterGuideFlow({
  type,
  steps,
  index,
  setIndex,
  onBackToScreener,
  onHome,
}) {
  const step = steps[index];
  const isFinal = Boolean(step.final);
  const screenerLabel =
    type === "bullish" ? "Back to Bullish Screener" : "Back to Bearish Screener";

  function goBack() {
    if (index === 0) {
      onBackToScreener();
      return;
    }

    setIndex(index - 1);
  }

  return (
    <section className="guide-shell">
      <header className="flow-nav" aria-label="Filter guide navigation">
        <button className="nav-button" type="button" onClick={goBack}>
          Back
        </button>
        <button className="nav-button" type="button" onClick={onHome}>
          Home
        </button>
      </header>

      <StepScreen
        title={step.title}
        support={step.support}
        tone={type === "bearish" ? "short" : "long"}
        actionLabel={isFinal ? screenerLabel : "Next"}
        onNext={isFinal ? onBackToScreener : () => setIndex(index + 1)}
      />
    </section>
  );
}

export default App;
