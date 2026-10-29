namespace Forasteiro.Api.Features.GitHub;

// os quartis do GitHub viram os tons da placa (l1..l4); qualquer valor novo fica apagado
public static class ContributionLevels
{
    public static int ToNumber(string? level) => level switch
    {
        "NONE" => 0,
        "FIRST_QUARTILE" => 1,
        "SECOND_QUARTILE" => 2,
        "THIRD_QUARTILE" => 3,
        "FOURTH_QUARTILE" => 4,
        _ => 0,
    };
}
