
export default function SummonerNameInput({
  summonerName,
  setSummonerName,
  summonerTag,
  setSummonerTag,
  region,
  setRegion,
  handleClick
}) {
  return (
    <>
      <input
        type="text"
        value={summonerName}
        onChange={(e) => setSummonerName(e.target.value)}
        placeholder="Summoner Name"
      />
      <span>#</span>
      <input
        type="text"
        value={summonerTag}
        onChange={(e) => setSummonerTag(e.target.value)}
        placeholder="Tagline"
      />
      <select
        value={region}
        onChange={(e) => setRegion(e.target.value)}
      >
        <option value="br1">BR</option>
        <option value="eun1">EUNE</option>
        <option value="euw1">EUW</option>
        <option value="jp1">JP</option>
        <option value="kr">KR</option>
        <option value="la1">LAN</option>
        <option value="la2">LAS</option>
        <option value="me1">ME</option>
        <option value="na1">NA</option>
        <option value="oc1">OCE</option>
        <option value="ru">RU</option>
        <option value="sg2">SEA</option>
        <option value="tr1">TR</option>
        <option value="tw2">TW</option>
        <option value="vn2">VN</option>

      </select>
      <button onClick={handleClick}>Search</button>

    </>
  )
}
