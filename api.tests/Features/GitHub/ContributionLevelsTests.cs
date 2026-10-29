using Forasteiro.Api.Features.GitHub;

namespace Forasteiro.Api.Tests.Features.GitHub;

public sealed class ContributionLevelsTests
{
    [Theory]
    [InlineData("NONE", 0)]
    [InlineData("FIRST_QUARTILE", 1)]
    [InlineData("SECOND_QUARTILE", 2)]
    [InlineData("THIRD_QUARTILE", 3)]
    [InlineData("FOURTH_QUARTILE", 4)]
    [InlineData("FIFTH_QUARTILE", 0)]
    [InlineData("", 0)]
    [InlineData(null, 0)]
    public void Converte_os_quartis_nos_tons_da_placa(string? level, int expected) =>
        Assert.Equal(expected, ContributionLevels.ToNumber(level));
}
