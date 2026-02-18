import React from "react";

import { BrowserRouter, Routes, Route, } from "react-router-dom";
import ChampionMastery from "./pages/ChampionMastery/ChampionMastery";
import Home from "./pages/Home/Home";
import MatchHistory from "./pages/MatchHistory/MatchHistory";
import LiveGame from "./pages/LiveGame/LiveGame";



export default function AppRoutes() {

    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home></Home>} />
                    <Route path="/ChampionMastery" element={<ChampionMastery></ChampionMastery>} />
                    <Route path="/MatchHistory" element={<MatchHistory></MatchHistory>} />
                    <Route path="/profile/:region/:nameTag/overview" element={<MatchHistory></MatchHistory>} />
                    <Route path="/profile/:region/:nameTag/mastery" element={<ChampionMastery></ChampionMastery>} />
                    <Route path="/profile/:region/:nameTag/livegame" element={<LiveGame></LiveGame>} />
                </Routes>
            </BrowserRouter>
        </>

    )

}