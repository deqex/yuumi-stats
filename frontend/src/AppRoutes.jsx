import React from "react";

import { BrowserRouter, Routes, Route, } from "react-router-dom";
import ChampionMastery from "./pages/ChampionMastery/ChampionMastery";
import Home from "./pages/Home/Home";




export default function AppRoutes() {

    return (
        <>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home></Home>} />
                    <Route path="/ChampionMastery" element={<ChampionMastery></ChampionMastery>} />
                </Routes>
            </BrowserRouter>
        </>

    )

}