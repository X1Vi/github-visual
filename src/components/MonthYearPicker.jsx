import { useState, useEffect } from "react";
import { COLORS } from "../theme/theme";

const TerminalMonthYearPicker = ({ onDateChange }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    const storedDate = localStorage.getItem("currentDate");
    const parsedDate = storedDate ? new Date(storedDate) : null;
    return parsedDate && !isNaN(parsedDate) ? parsedDate : new Date();
  });
  
  const [isFocused, setIsFocused] = useState(null);

  useEffect(() => {
    localStorage.setItem("currentDate", currentDate.toISOString());
  }, [currentDate]);

  const handleMonthChange = (e) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(parseInt(e.target.value, 10));
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const handleYearChange = (e) => {
    const newDate = new Date(currentDate);
    newDate.setFullYear(parseInt(e.target.value, 10));
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  return (
    <div style={{
      display: "flex", 
      flexDirection: "column", 
      width: "100%", 
      maxWidth: "400px", 
      backgroundColor: COLORS.primaryBg, 
      color: COLORS.calDay4Bg, 
      padding: "16px", 
      border: `2px solid ${COLORS.calDay4Bg}`, 
      borderRadius: "6px", 
      fontFamily: "monospace", 
      position: "relative",
      marginBottom: "32px"
    }}>
      {/* Terminal header */}
      <div style={{
        display: "flex", 
        alignItems: "center", 
        marginBottom: "12px", 
        paddingBottom: "8px", 
        borderBottom: `1px solid ${COLORS.calDay2Bg}`
      }}>
        <div style={{ display: "flex", marginRight: "16px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#ef4444", marginRight: "8px" }}></div>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#eab308", marginRight: "8px" }}></div>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: COLORS.calDay2Bg }}></div>
        </div>
        <div style={{
          textAlign: "center", 
          flex: 1, 
          color: COLORS.calDay4Bg, 
          fontSize: "14px", 
          opacity: 0.8
        }}>terminal-date-selector</div>
      </div>
      
      {/* Command prompt line */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ color: COLORS.calDay2Bg, marginRight: "8px" }}>$</span>
        <span style={{ marginRight: "8px" }}>select-date</span>
        <span style={{ color: COLORS.secondaryText }}>--interactive</span>
      </div>
      
      {/* Date selector */}
      <div style={{
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "16px", 
        padding: "8px", 
        border: `1px solid ${COLORS.calDay1Bg}`, 
        backgroundColor: COLORS.primaryBg, 
        borderRadius: "4px"
      }}>
        {/* Month Selector */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: COLORS.calDay2Bg, marginRight: "4px" }}>&gt;</span>
            <label style={{ color: COLORS.calDay4Bg, marginRight: "8px" }}>Month:</label>
          </div>
          <div style={{
            marginTop: "4px", 
            position: "relative", 
            border: isFocused === 'month' ? `1px solid ${COLORS.calDay4Bg}` : "none"
          }}>
            <select 
              value={currentDate.getMonth()} 
              onChange={handleMonthChange}
              onFocus={() => setIsFocused('month')}
              onBlur={() => setIsFocused(null)}
              style={{
                width: "100%", 
                backgroundColor: COLORS.primaryBg, 
                color: COLORS.calDay4Bg, 
                border: `1px solid ${COLORS.calDay1Bg}`, 
                padding: "8px", 
                appearance: "none", 
                outline: "none", 
                cursor: "pointer", 
                borderRadius: "4px"
              }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i} style={{ backgroundColor: COLORS.primaryBg, color: COLORS.calDay4Bg }}>
                  {new Date(0, i).toLocaleString("default", { month: "long" })}
                </option>
              ))}
            </select>
            <div style={{
              position: "absolute", 
              top: 0, 
              bottom: 0, 
              right: 0, 
              display: "flex", 
              alignItems: "center", 
              padding: "0 8px", 
              pointerEvents: "none"
            }}>
              <span style={{ color: COLORS.calDay2Bg }}>▼</span>
            </div>
          </div>
        </div>

        {/* Year Selector */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: COLORS.calDay2Bg, marginRight: "4px" }}>&gt;</span>
            <label style={{ color: COLORS.calDay4Bg, marginRight: "8px" }}>Year:</label>
          </div>
          <div style={{
            marginTop: "4px", 
            position: "relative", 
            border: isFocused === 'year' ? `1px solid ${COLORS.calDay4Bg}` : "none"
          }}>
            <select 
              value={currentDate.getFullYear()} 
              onChange={handleYearChange}
              onFocus={() => setIsFocused('year')}
              onBlur={() => setIsFocused(null)}
              style={{
                width: "100%", 
                backgroundColor: COLORS.primaryBg, 
                color: COLORS.calDay4Bg, 
                border: `1px solid ${COLORS.calDay1Bg}`, 
                padding: "8px", 
                appearance: "none", 
                outline: "none", 
                cursor: "pointer", 
                borderRadius: "4px"
              }}
            >
              {Array.from({ length: 10 }, (_, i) => (
                <option key={i} value={new Date().getFullYear() - 5 + i} style={{ backgroundColor: COLORS.primaryBg, color: COLORS.calDay4Bg }}>
                  {new Date().getFullYear() - 5 + i}
                </option>
              ))}
            </select>
            <div style={{
              position: "absolute", 
              top: 0, 
              bottom: 0, 
              right: 0, 
              display: "flex", 
              alignItems: "center", 
              padding: "0 8px", 
              pointerEvents: "none"
            }}>
              <span style={{ color: COLORS.calDay2Bg }}>▼</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Current selection display */}
      <div style={{ marginTop: "16px", borderTop: `1px solid ${COLORS.calDay1Bg}`, paddingTop: "8px" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={{ color: COLORS.calDay2Bg, marginRight: "8px" }}>&gt;</span>
          <span style={{ color: COLORS.secondaryText }}>Current selection:</span>
          <span style={{ marginLeft: "8px", fontWeight: "bold", color: COLORS.calDay4Bg }}>
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Blinking cursor */}
      <div style={{ marginTop: "16px", display: "flex", alignItems: "center" }}>
        <span style={{ color: COLORS.calDay2Bg, marginRight: "8px" }}>$</span>
        <div style={{ 
          height: "16px", 
          width: "8px", 
          backgroundColor: COLORS.calDay4Bg,
          animation: "blink 1s step-start infinite"
        }}></div>
        <style>{`
          @keyframes blink {
            50% { opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default TerminalMonthYearPicker;
