import { useState, useEffect } from "react";

const MonthYearPicker = ({ onDateChange }) => {
    const [currentDate, setCurrentDate] = useState(() => {
        const storedDate = localStorage.getItem("currentDate");
        const parsedDate = storedDate ? new Date(storedDate) : null;
        return parsedDate && !isNaN(parsedDate) ? parsedDate : new Date();
    });

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
        <div style={{ display: "flex", gap: "8px", alignItems: "center", backgroundColor: "black", color: "lightgreen", padding: "10px", fontFamily: "monospace", border: "2px solid lightgreen", borderRadius: "5px" }}>
            <label style={{ color: "lightgreen" }}>Month:</label>
            <select value={currentDate.getMonth()} onChange={handleMonthChange} style={{ backgroundColor: "black", color: "lightgreen", border: "1px solid lightgreen", padding: "5px" }}>
                {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i} style={{ backgroundColor: "black", color: "lightgreen" }}>
                        {new Date(0, i).toLocaleString("default", { month: "long" })}
                    </option>
                ))}
            </select>
            <label style={{ color: "lightgreen", marginLeft: "10px" }}>Year:</label>
            <select value={currentDate.getFullYear()} onChange={handleYearChange} style={{ backgroundColor: "black", color: "lightgreen", border: "1px solid lightgreen", padding: "5px" }}>
                {Array.from({ length: 10 }, (_, i) => (
                    <option key={i} value={new Date().getFullYear() - 5 + i} style={{ backgroundColor: "black", color: "lightgreen" }}>
                        {new Date().getFullYear() - 5 + i}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default MonthYearPicker;
