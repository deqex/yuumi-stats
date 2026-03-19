import { BrowserRouter, Routes, Route, } from "react-router-dom";
import Toast from "./components/Toast/Toast";
import ChampionMastery from "./pages/ChampionMastery/ChampionMastery";
import Home from "./pages/Home/Home";
import MatchHistory from "./pages/MatchHistory/MatchHistory";
import LiveGame from "./pages/LiveGame/LiveGame";
import Analysis from "./pages/Analysis/Analysis";
import Leaderboard from "./pages/Leaderboard/Leaderboard";
import Login from "./pages/Login/Login";
import Account from "./pages/Account/Account";
import Groups from "./pages/Group/Groups";
import Group from "./pages/Group/Group";
import NotFound from "./pages/NotFound/NotFound";
import { AuthProvider } from "./context/AuthContext";



export default function AppRoutes() {

    return (
        <>
            <BrowserRouter>
                <AuthProvider>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/ChampionMastery" element={<ChampionMastery />} />
                        <Route path="/MatchHistory" element={<MatchHistory />} />
                        <Route path="/profile/:region/:nameTag/overview" element={<MatchHistory />} />
                        <Route path="/profile/:region/:nameTag/mastery" element={<ChampionMastery />} />
                        <Route path="/profile/:region/:nameTag/livegame" element={<LiveGame />} />
                        <Route path="/profile/:region/:nameTag/analysis" element={<Analysis />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/account" element={<Account />} />
                        <Route path="/groups" element={<Groups />} />
                        <Route path="/groups/:groupId" element={<Group />} />
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </AuthProvider>
                <Toast />
            </BrowserRouter>
        </>

    )

}